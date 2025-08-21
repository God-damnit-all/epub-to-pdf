const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");
const { execSync } = require("child_process");
const os = require("os");

// Function to unzip EPUB file
function unzipEpub(epubPath, extractDir) {
  console.log(`📦 Unzipping ${epubPath}...`);

  // Create extraction directory if it doesn't exist
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  } else {
    // Clean existing directory
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.mkdirSync(extractDir, { recursive: true });
  }

  try {
    // Use system's unzip command (works on Linux/Mac/Windows with unzip installed)
    if (process.platform === "win32") {
      // Windows - try PowerShell expand-archive first, fallback to 7zip or unzip
      try {
        execSync(
          `powershell -Command "Expand-Archive -Path '${epubPath}' -DestinationPath '${extractDir}' -Force"`,
          { stdio: "inherit" }
        );
      } catch (e) {
        // Fallback to 7zip or unzip
        try {
          execSync(`7z x "${epubPath}" -o"${extractDir}" -y`, {
            stdio: "inherit",
          });
        } catch (e2) {
          execSync(`unzip -o "${epubPath}" -d "${extractDir}"`, {
            stdio: "inherit",
          });
        }
      }
    } else {
      // Linux/Mac - use unzip
      execSync(`unzip -o "${epubPath}" -d "${extractDir}"`, {
        stdio: "inherit",
      });
    }

    console.log(`✅ Extracted to ${extractDir}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to unzip EPUB: ${error.message}`);
    console.log(
      "💡 Make sure you have 'unzip' command installed on your system"
    );
    return false;
  }
}

// Function to find OEBPS or content directory
function findContentDirectory(extractDir) {
  const possiblePaths = [
    path.join(extractDir, "OEBPS"),
    path.join(extractDir, "OPS"),
    path.join(extractDir, "content"),
    path.join(extractDir, "src"),
    extractDir, // Sometimes files are in root
  ];

  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      const hasXhtml = files.some(
        (f) => f.endsWith(".xhtml") || f.endsWith(".html")
      );
      if (hasXhtml) {
        console.log(`📁 Found content directory: ${dirPath}`);
        return dirPath;
      }
    }
  }

  // Fallback: search recursively for .xhtml files
  function findXhtmlRecursively(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const result = findXhtmlRecursively(itemPath);
        if (result) return result;
      } else if (item.endsWith(".xhtml") || item.endsWith(".html")) {
        return dir;
      }
    }
    return null;
  }

  const foundDir = findXhtmlRecursively(extractDir);
  if (foundDir) {
    console.log(`📁 Found content directory recursively: ${foundDir}`);
    return foundDir;
  }

  throw new Error("Could not find XHTML content in the extracted EPUB");
}

async function epubToPdf(contentDir, outputPdf) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
    ],
  });
  const page = await browser.newPage();

  // Function to detect if an XHTML file contains a spread background
  function detectSpreadBackground(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      // Look for spread background images like "1.2.jpg", "3.4.jpg", "23.24.jpg"
      const spreadPattern = /src="image\/\d+\.\d+\.jpg"/;
      return spreadPattern.test(content);
    } catch (error) {
      return false;
    }
  }

  // Get all XHTML files
  const allFiles = fs.readdirSync(contentDir);
  const files = allFiles
    .filter((f) => f.endsWith(".xhtml") || f.endsWith(".html"))
    .filter((f) => !f.toLowerCase().includes("toc"))
    .sort((a, b) => {
      // Extract numbers from filenames for proper numerical sorting
      const getNumber = (filename) => {
        const match = filename.match(/-(\d+)\.xhtml?$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      return getNumber(a) - getNumber(b);
    }); // Sort numerically by the number in filename

  if (files.length === 0) {
    throw new Error("No XHTML files found in the content directory");
  }

  console.log(
    `📄 Found ${files.length} content files:`,
    files.map((f) => f.substring(0, 30) + (f.length > 30 ? "..." : ""))
  );

  // Load first file to get viewport dimensions
  const firstFilePath = path.resolve(contentDir, files[0]);
  await page.goto("file://" + firstFilePath, {
    waitUntil: "networkidle0",
  });

  // Get the exact viewport dimensions from the EPUB
  const viewportInfo = await page.evaluate(() => {
    // Check for viewport meta tag (critical for fixed-layout)
    const viewport = document.querySelector('meta[name="viewport"]');
    const viewportContent = viewport ? viewport.getAttribute("content") : null;

    let viewportWidth = null;
    let viewportHeight = null;

    if (viewportContent) {
      const widthMatch = viewportContent.match(/width=([^,\s]+)/);
      const heightMatch = viewportContent.match(/height=([^,\s]+)/);
      if (widthMatch) viewportWidth = parseInt(widthMatch[1]);
      if (heightMatch) viewportHeight = parseInt(heightMatch[1]);
    }

    // Also check for any CSS-defined fixed dimensions
    const htmlStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);

    return {
      viewport: {
        width: viewportWidth,
        height: viewportHeight,
        content: viewportContent,
      },
      html: {
        width: parseInt(htmlStyle.width) || null,
        height: parseInt(htmlStyle.height) || null,
      },
      body: {
        width: document.body.offsetWidth,
        height: document.body.offsetHeight,
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      },
    };
  });

  console.log("📐 Viewport Info:", viewportInfo);

  // For fixed-layout EPUBs, use the exact viewport dimensions
  const exactWidth =
    viewportInfo.viewport.width || viewportInfo.body.width || 595;
  const exactHeight =
    viewportInfo.viewport.height || viewportInfo.body.height || 842;

  console.log(`📏 Using dimensions: ${exactWidth}x${exactHeight}`);

  // Set the browser viewport to EXACTLY match the EPUB viewport
  await page.setViewport({
    width: exactWidth,
    height: exactHeight,
    deviceScaleFactor: 1.0, // Critical: no scaling for fixed-layout
  });

  let pdfs = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.resolve(contentDir, file);
    const isSpread = detectSpreadBackground(filePath);

    console.log(
      `🔄 Processing ${i + 1}/${files.length}: ${file}${
        isSpread ? " (spread layout detected)" : ""
      }`
    );

    await page.goto("file://" + filePath, {
      waitUntil: "networkidle0",
    });

    // Wait for content to load completely
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For fixed-layout EPUBs, we need to preserve the exact layout
    await page.addStyleTag({
      content: `
        /* Critical: Preserve exact fixed-layout dimensions */
        html {
          width: ${exactWidth}px !important;
          height: ${exactHeight}px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          zoom: 1 !important;
          transform: none !important;
        }
        
        body {
          width: ${exactWidth}px !important;
          height: ${exactHeight}px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          zoom: 1 !important;
          transform: none !important;
          position: relative !important;
        }
        
        /* Prevent any automatic scaling */
        * {
          zoom: 1 !important;
          transform-origin: top left !important;
          box-sizing: border-box !important;
        }
        
        /* Ensure images maintain their exact size */
        img {
          max-width: none !important;
          max-height: none !important;
        }
        
        /* Remove any default margins/padding that might affect layout */
        h1, h2, h3, h4, h5, h6, p, div {
          margin: inherit !important;
          padding: inherit !important;
        }
        
        @media print {
          html, body {
            width: ${exactWidth}px !important;
            height: ${exactHeight}px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `,
    });

    // Generate PDF with EXACT dimensions (no margins, no scaling)
    const pdfBuffer = await page.pdf({
      width: exactWidth, // Use number directly, not string
      height: exactHeight, // Use number directly, not string
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      printBackground: true,
      preferCSSPageSize: false, // Don't let CSS override our exact dimensions
      displayHeaderFooter: false,
      format: null, // Don't use standard page formats
      scale: 1.0, // No scaling
    });

    pdfs.push(pdfBuffer);
  }

  await browser.close();

  // Merge all PDFs
  console.log("📎 Merging PDFs...");
  const finalDoc = await PDFDocument.create();

  for (let i = 0; i < pdfs.length; i++) {
    try {
      const pdf = await PDFDocument.load(pdfs[i]);
      const pageIndices = Array.from(
        { length: pdf.getPageCount() },
        (_, i) => i
      );
      const pages = await finalDoc.copyPages(pdf, pageIndices);
      pages.forEach((page) => finalDoc.addPage(page));
    } catch (error) {
      console.error(`❌ Error processing PDF ${i}:`, error);
    }
  }

  const pdfBytes = await finalDoc.save();
  fs.writeFileSync(outputPdf, pdfBytes);

  // Get final PDF info
  const stats = fs.statSync(outputPdf);
  console.log(
    `✅ PDF saved to ${outputPdf} (${Math.round(stats.size / 1024)} KB)`
  );

  // Verify PDF dimensions
  const finalPdf = await PDFDocument.load(pdfBytes);
  const firstPage = finalPdf.getPage(0);
  const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();
  console.log(
    `📏 Final PDF dimensions: ${Math.round(pdfWidth)}x${Math.round(pdfHeight)}`
  );
}

// Main function that handles the entire process
async function convertEpubToPdf(epubPath, outputPdf = null) {
  console.log(`🚀 Starting EPUB to PDF conversion...`);
  console.log(`📖 Input: ${epubPath}`);

  // Validate input file
  if (!fs.existsSync(epubPath)) {
    throw new Error(`EPUB file not found: ${epubPath}`);
  }

  // Generate output filename if not provided
  if (!outputPdf) {
    const baseName = path.basename(epubPath, path.extname(epubPath));
    outputPdf = path.join(path.dirname(epubPath), `${baseName}.pdf`);
  }

  // Create temporary directory for extraction
  const tempDir = path.join(os.tmpdir(), `epub_extract_${Date.now()}`);

  try {
    // Step 1: Unzip the EPUB
    const extractSuccess = unzipEpub(epubPath, tempDir);
    if (!extractSuccess) {
      throw new Error("Failed to extract EPUB file");
    }

    // Step 2: Find the content directory
    const contentDir = findContentDirectory(tempDir);

    // Step 3: Convert to PDF
    await epubToPdf(contentDir, outputPdf);

    console.log(`🎉 Conversion complete!`);
    console.log(`📄 Output: ${outputPdf}`);
  } finally {
    // Clean up temporary directory
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up temporary files`);
      }
    } catch (cleanupError) {
      console.warn(
        `⚠️  Could not clean up temp directory: ${cleanupError.message}`
      );
    }
  }
}

// Batch conversion function
async function convertMultipleEpubs(epubDirectory, outputDirectory = null) {
  const epubFiles = fs
    .readdirSync(epubDirectory)
    .filter((f) => f.toLowerCase().endsWith(".epub"));

  if (epubFiles.length === 0) {
    console.log("No EPUB files found in the directory");
    return;
  }

  console.log(`📚 Found ${epubFiles.length} EPUB files to convert`);

  for (let i = 0; i < epubFiles.length; i++) {
    const epubFile = epubFiles[i];
    const epubPath = path.join(epubDirectory, epubFile);
    const outputPdf = outputDirectory
      ? path.join(outputDirectory, epubFile.replace(/\.epub$/i, ".pdf"))
      : epubPath.replace(/\.epub$/i, ".pdf");

    console.log(`\n📖 Converting ${i + 1}/${epubFiles.length}: ${epubFile}`);

    try {
      await convertEpubToPdf(epubPath, outputPdf);
    } catch (error) {
      console.error(`❌ Failed to convert ${epubFile}: ${error.message}`);
    }
  }

  console.log(`\n🎉 Batch conversion complete!`);
}

// Usage examples:
// Convert a single EPUB:
// convertEpubToPdf("test.epub");
// convertEpubToPdf("test.epub", "custom_output.pdf");

// Convert all EPUBs in a directory:
// convertMultipleEpubs("./epub_folder");
// convertMultipleEpubs("./epub_folder", "./pdf_output");

// Export functions for use as module
module.exports = {
  convertEpubToPdf,
  convertMultipleEpubs,
};

// If run directly, convert the EPUB file passed as argument
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  node index.js <epub_file> [output_pdf]           - Convert single EPUB
  node index.js --batch <epub_directory>          - Convert all EPUBs in directory
  
Examples:
  node index.js test.epub
  node index.js test.epub output.pdf
  node index.js --batch ./my_epubs
    `);
    process.exit(1);
  }

  if (args[0] === "--batch") {
    convertMultipleEpubs(args[1], args[2]);
  } else {
    convertEpubToPdf(args[0], args[1]);
  }
}

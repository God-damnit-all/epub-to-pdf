# EPUB to PDF Converter

A **Node.js tool** that converts EPUB (fixed-layout or reflowable) files into **print-ready PDFs** using Puppeteer and pdf-lib.
Supports both **single file** conversion and **batch conversion** of multiple EPUBs.

---

## Features

* Extracts EPUB files (supports `.epub` format)
* Auto-detects **content directory** (`OEBPS`, `OPS`, `content`, `src`, or root)
* Preserves **fixed-layout dimensions** (width/height from EPUB viewport meta)
* Handles **spread layouts** (background images spanning two pages)
* Outputs **exact-size, high-quality PDFs** with no scaling
* Merges all EPUB XHTML/HTML pages into one PDF
* Works on **Linux, macOS, and Windows**
* Supports **batch conversion** for entire directories

---

## Dependencies

Make sure the following are installed on your system:

* [Node.js](https://nodejs.org/) (>= 16 recommended)
* [Puppeteer](https://pptr.dev/) (headless Chrome for rendering)
* [pdf-lib](https://pdf-lib.js.org/) (for merging PDFs)
* A system unzip utility:

  * Linux/macOS: `unzip`
  * Windows: PowerShell `Expand-Archive` (built-in), or [7-Zip](https://www.7-zip.org/)

Install required Node.js packages:

```bash
npm install puppeteer pdf-lib
```

---

## Project Structure

```
epub-to-pdf/
│── index.js            # Main script
│── package.json
```

---

## Usage

### 1. Convert a Single EPUB

```bash
node index.js mybook.epub
```

This will output `mybook.pdf` in the same directory.

Custom output filename:

```bash
node index.js mybook.epub output.pdf
```

---

### 2. Batch Convert Multiple EPUBs

Convert all `.epub` files in a directory:

```bash
node index.js --batch ./epubs
```

Output will be saved in the same folder.

Specify output directory:

```bash
node index.js --batch ./epubs ./pdfs
```

---

## PDF Output Details

* **Fixed-layout EPUBs** → PDF matches exact dimensions from `viewport` meta tag.
* **Reflowable EPUBs** → Defaults to A4-like size (`595x842`).
* **Spread pages** detected and preserved.
* **Images & text** are embedded without scaling.

---

## Example

Convert `test.epub` to PDF:

```bash
node index.js test.epub
```

Output:

```
Starting EPUB to PDF conversion...
Unzipping test.epub...
Found content directory: /tmp/epub_extract_123456/OEBPS
Found 12 content files
Viewport Info: { width: 1200, height: 1800 }
Using dimensions: 1200x1800
Processing 1/12: page-1.xhtml
...
Merging PDFs...
PDF saved to test.pdf (2048 KB)
Final PDF dimensions: 1200x1800
Conversion complete!
```

---

## API (Programmatic Use)

You can also use this module in your own Node.js scripts:

```js
const { convertEpubToPdf, convertMultipleEpubs } = require("./index");

// Convert single EPUB
await convertEpubToPdf("book.epub", "book.pdf");

// Convert multiple EPUBs in a directory
await convertMultipleEpubs("./epubs", "./pdfs");
```

---

## Notes & Troubleshooting

* On **Windows**, if extraction fails:

  * Ensure PowerShell `Expand-Archive` is available.
  * Or install [7-Zip](https://www.7-zip.org/) and add it to PATH.
* If PDF has wrong dimensions, ensure your EPUB has correct `<meta name="viewport">`.
* Puppeteer downloads Chromium automatically. If issues arise, run:

  ```bash
  npx puppeteer browsers install chrome
  ```

---

## License

MIT License. Free to use and modify.


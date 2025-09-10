# EPUB to PDF Converter

A powerful and elegant tool that converts EPUB files to high-quality PDFs with exceptional Arabic text rendering using the beautiful Amiri font. Perfect for preserving the typography and layout of Arabic ebooks, documents, and publications.

## ✨ What This Tool Does

This converter specializes in transforming EPUB files into PDF format while maintaining:

- **Beautiful Arabic Typography**: Uses the renowned Amiri font, specifically designed for Arabic text, ensuring proper glyph shaping, ligatures, and spacing
- **Layout Preservation**: Maintains the original fixed-layout design of EPUB files
- **High-Quality Output**: Generates crisp, professional PDFs suitable for printing and digital distribution
- **Batch Processing**: Convert multiple EPUB files at once
- **Cross-Platform**: Works on Windows, macOS, and Linux

### 🎯 Perfect For:

- Arabic ebooks and novels
- Academic papers and theses
- Religious texts (Quran, Hadith collections)
- Government documents
- Educational materials
- Any content requiring proper Arabic typography

## 🚀 Features

- ✅ **Superior Arabic Text Rendering** - Amiri font with proper Arabic script support
- ✅ **Fixed-Layout Preservation** - Maintains exact positioning and design
- ✅ **High-Resolution Output** - Crisp text and graphics
- ✅ **Batch Conversion** - Process multiple files simultaneously
- ✅ **Automatic Font Loading** - No manual font installation required
- ✅ **Clean Architecture** - Simple, maintainable codebase
- ✅ **Cross-Platform Compatibility** - Windows, macOS, Linux
- ✅ **Memory Efficient** - Processes large files without excessive memory usage

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

```bash
# Clone or download the repository
cd epub-to-pdf

# Install dependencies
npm install
```

## 🎮 Usage

### Convert a Single EPUB File

```bash
# Basic conversion (output: input.pdf)
node index.js mybook.epub

# Custom output filename
node index.js mybook.epub custom-name.pdf
```

### Batch Convert Multiple Files

```bash
# Convert all EPUB files in a directory
node index.js --batch ./books-directory

# Convert to specific output directory
node index.js --batch ./input-books ./output-pdfs
```

### Advanced Usage

```bash
# Convert with progress logging
node index.js arabic-novel.epub

# Process large collections
node index.js --batch ./epub-library
```

## 🔧 How It Works

1. **EPUB Extraction**: Unzips the EPUB file to access internal content
2. **Content Discovery**: Finds and organizes XHTML content files
3. **Font Loading**: Loads Amiri Regular and Bold fonts into memory
4. **Page Processing**: Renders each page with proper Arabic typography
5. **PDF Generation**: Creates individual PDFs for each page
6. **Merging**: Combines all pages into a single, cohesive PDF document

## 📋 Requirements

### System Requirements

- **Node.js**: v14.0.0 or higher
- **Memory**: 512MB minimum (1GB recommended for large files)
- **Storage**: 2x the size of input EPUB files for temporary processing

### Dependencies

- `puppeteer` - Headless browser for PDF generation
- `pdf-lib` - PDF manipulation and merging
- Amiri fonts (included in the `fonts/` directory)

### Supported Platforms

- **Windows**: PowerShell for archive extraction
- **macOS/Linux**: unzip command for archive extraction

## 🎨 Typography Features

### Amiri Font Benefits

- **Classical Arabic Design**: Based on traditional Arabic typography
- **Proper Glyph Shaping**: Correct rendering of Arabic letter forms
- **Ligature Support**: Beautiful connected letter combinations
- **Multiple Weights**: Regular and Bold variants included
- **Unicode Compliant**: Full Arabic Unicode support

### Text Processing

- Automatic font application to all text elements
- Preservation of original text formatting
- Support for mixed Arabic/English content
- Proper handling of right-to-left text direction

## 🐛 Troubleshooting

### Common Issues

**"Command 'unzip' not found" (Linux/macOS)**

```bash
# Install unzip
sudo apt-get install unzip  # Ubuntu/Debian
brew install unzip          # macOS
```

**"PowerShell command failed" (Windows)**

- Ensure PowerShell is available in PATH
- Try running as Administrator if permission issues occur

**"Font not loading"**

- Ensure `fonts/` directory contains Amiri font files
- Check file permissions on font files

**"Memory errors with large files"**

- Increase Node.js memory limit: `node --max-old-space-size=4096 index.js`
- Process files individually instead of batch processing

### Performance Tips

- Process one large file at a time for best performance
- Ensure adequate free RAM (2GB+ recommended)
- Close other memory-intensive applications during conversion

## 📝 Examples

### Arabic Book Conversion

```bash
node index.js "Arabic Literature.epub" "Literature.pdf"
```

### Academic Paper Processing

```bash
node index.js thesis.epub thesis-final.pdf
```

### Religious Text Conversion

```bash
node index.js quran-study.epub quran-print.pdf
```

### Batch Library Processing

```bash
node index.js --batch ./arabic-books ./pdf-library
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## 📄 License

ISC License - feel free to use in your projects!

## 🙏 Acknowledgments

- **Amiri Font**: Created by Khaled Hosny, based on Bulaq Press typography
- **Puppeteer**: For excellent PDF generation capabilities
- **pdf-lib**: For seamless PDF merging functionality

---

**Made with ❤️ for the Arabic-speaking community**

# EPUB to PDF Converter

A simple and reliable tool to convert EPUB files to PDF with beautiful Amiri font support for Arabic text.

## Features

- ✅ Converts EPUB files to high-quality PDFs
- ✅ Uses Amiri font for excellent Arabic text rendering
- ✅ Preserves original layout and formatting
- ✅ Supports fixed-layout EPUBs
- ✅ Batch conversion for multiple files
- ✅ Clean, simple codebase

## Installation

```bash
npm install
```

## Usage

### Convert a single EPUB file

```bash
node index.js book.epub
```

### Convert with custom output name

```bash
node index.js book.epub output.pdf
```

### Convert all EPUB files in a directory

```bash
node index.js --batch ./books
```

## Requirements

- Node.js
- PowerShell (Windows) or unzip (Linux/Mac)
- Amiri fonts (included)

## How it works

1. Extracts the EPUB file contents
2. Loads Amiri fonts for Arabic text rendering
3. Processes each page with proper typography
4. Generates a merged PDF with preserved layout

## Dependencies

- `puppeteer` - For PDF generation
- `pdf-lib` - For PDF merging
- Amiri fonts - For Arabic typography

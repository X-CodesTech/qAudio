const fs = require('fs');
const path = require('path');
const express = require('express');
const puppeteer = require('puppeteer');

// Create Express app to serve the HTML version of the documentation
const app = express();
const PORT = 3002;
let server;

// Serve static files from the docs directory
app.use(express.static(__dirname));

// Serve attached_assets directory
app.use('/attached_assets', express.static(path.join(__dirname, '..', 'attached_assets')));

// Function to generate PDF
async function generatePDF() {
  try {
    // Start the server
    server = app.listen(PORT);
    console.log(`Temporary server started on port ${PORT}`);

    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Navigate to our PDF converter page
    const url = `http://localhost:${PORT}/pdf-converter.html`;
    console.log(`Loading page: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Give time for JavaScript to execute and Markdown to convert
    console.log('Waiting for content to load...');
    await page.waitForTimeout(2000);

    // Print to PDF
    console.log('Generating PDF...');
    const pdfPath = path.join(__dirname, 'QCallerStudio_Documentation.pdf');
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center; margin-top: 5px;">QCaller Studio Documentation</div>',
      footerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center; margin-bottom: 5px;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });

    console.log(`PDF saved to: ${pdfPath}`);

    // Close browser and server
    await browser.close();
    server.close(() => {
      console.log('Temporary server closed');
    });

    return pdfPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (server) {
      server.close(() => {
        console.log('Temporary server closed after error');
      });
    }
    throw error;
  }
}

// Only run the script if it's called directly
if (require.main === module) {
  generatePDF()
    .then(pdfPath => {
      console.log(`✅ PDF successfully generated at: ${pdfPath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ PDF generation failed:', error);
      process.exit(1);
    });
}

module.exports = { generatePDF };
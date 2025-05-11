import puppeteer from 'puppeteer';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Create a simple server to serve our HTML page
const app = express();
const PORT = 3000;
const server = app.listen(PORT);

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the docs directory
app.use(express.static(join(__dirname, 'docs')));
app.use('/attached_assets', express.static(join(__dirname, 'attached_assets')));

// Create the HTML content
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>QCaller Studio Documentation</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1, h2, h3 {
            color: #333;
        }
        
        h1 {
            font-size: 28px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        h2 {
            font-size: 24px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        
        h3 {
            font-size: 20px;
        }
        
        img {
            max-width: 100%;
            display: block;
            margin: 20px auto;
        }
        
        pre {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        
        code {
            background-color: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        ul, ol {
            padding-left: 25px;
        }
        
        .cover-page {
            text-align: center;
            padding: 60px 0;
        }
        
        .cover-logo {
            max-width: 200px;
            margin-bottom: 40px;
        }
        
        .metadata {
            margin-top: 60px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="cover-page">
        <img class="cover-logo" src="/attached_assets/qcaller_logo_v4.png" alt="QCaller Studio Logo">
        <h1>QCaller Studio</h1>
        <h2>Comprehensive Features Documentation</h2>
        <div class="metadata">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Date:</strong> May 8, 2025</p>
            <p><strong>Author:</strong> QCaller Studio Development Team</p>
        </div>
    </div>
    
    <div id="content"></div>
    
    <script>
        // Load the markdown content from file
        fetch('/QCallerStudio_Documentation.md')
            .then(response => response.text())
            .then(markdown => {
                // We'll just display it as pre-formatted text for simplicity
                document.getElementById('content').innerHTML = '<pre>' + markdown + '</pre>';
            })
            .catch(error => {
                console.error('Error loading markdown:', error);
                document.getElementById('content').innerHTML = '<p>Error loading documentation.</p>';
            });
    </script>
</body>
</html>
`;

// Route to serve the generated HTML
app.get('/', (req, res) => {
    res.send(htmlContent);
});

// Create temp HTML file
const tempHtmlPath = join(__dirname, 'temp-docs.html');
fs.writeFileSync(tempHtmlPath, htmlContent);

async function generatePDF() {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Load the HTML file
        console.log('Loading HTML file...');
        await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
        
        // Wait for any content to load
        await page.waitForTimeout(1000);
        
        // Generate PDF
        console.log('Generating PDF...');
        const pdfPath = join(__dirname, 'QCallerStudio_Documentation.pdf');
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
            headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">QCaller Studio Documentation</div>',
            footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
        });
        
        console.log(`PDF saved to: ${pdfPath}`);
        
        // Clean up
        await browser.close();
        server.close(() => {
            console.log('Server closed');
        });
        
        // Delete temp HTML file
        fs.unlinkSync(tempHtmlPath);
        
        return pdfPath;
    } catch (error) {
        console.error('Error generating PDF:', error);
        server.close(() => console.log('Server closed due to error'));
        // Clean up temp file if it exists
        if (fs.existsSync(tempHtmlPath)) {
            fs.unlinkSync(tempHtmlPath);
        }
        throw error;
    }
}

// Generate the PDF
console.log('Starting PDF generation...');
generatePDF()
    .then(pdfPath => {
        console.log(`✅ PDF successfully generated at: ${pdfPath}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ PDF generation failed:', error);
        process.exit(1);
    });
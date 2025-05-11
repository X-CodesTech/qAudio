const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
require('html2canvas');

// Create a new PDF document
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Read the markdown file
const markdownContent = fs.readFileSync(path.join(__dirname, 'QCallerStudio_Documentation.md'), 'utf8');

// Convert markdown to HTML
const htmlContent = marked(markdownContent);

// Function to add a cover page
function addCoverPage() {
  // Add logo
  try {
    const imgPath = path.join(__dirname, '..', 'attached_assets', 'qcaller_logo_v4.png');
    if (fs.existsSync(imgPath)) {
      const imgData = fs.readFileSync(imgPath);
      const imgBase64 = Buffer.from(imgData).toString('base64');
      doc.addImage(imgBase64, 'PNG', 75, 50, 60, 60); // Adjust position and size as needed
    }
  } catch (err) {
    console.error('Error adding logo:', err);
  }

  // Add title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('QCaller Studio', 105, 140, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Features Documentation', 105, 155, { align: 'center' });
  
  // Add metadata
  doc.setFontSize(12);
  doc.text('Version: 1.0.0', 105, 180, { align: 'center' });
  doc.text('Date: May 8, 2025', 105, 190, { align: 'center' });
  doc.text('Author: QCaller Studio Development Team', 105, 200, { align: 'center' });
  
  // Add new page after cover
  doc.addPage();
}

// Function to add content to the PDF
function addContent() {
  // Parse HTML content and add it to PDF
  // Note: This is a simplified version and doesn't handle all HTML elements
  
  // Split content by sections
  const sections = htmlContent.split('<h2');
  
  // Add table of contents
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', 20, 20);
  
  let y = 35;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  sections.forEach((section, index) => {
    if (index === 0) return; // Skip the first element (before the first h2)
    
    // Extract section title
    const titleMatch = section.match(/>([^<]+)</);
    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].trim();
      doc.text(`${index}. ${title}`, 25, y);
      y += 10;
      
      // If y position is too low, add a new page
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
  });
  
  // Add content pages
  doc.addPage();
  
  // Add each section
  y = 20;
  let currentPage = 3; // Starting from page 3 (after cover and TOC)
  
  sections.forEach((section, index) => {
    if (index === 0) return; // Skip the first element
    
    // Extract section title
    const titleMatch = section.match(/>([^<]+)</);
    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].trim();
      
      // Add section title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, y);
      y += 15;
      
      // Extract and add content
      // This is simplified and doesn't handle all HTML formatting
      let content = section.split('</h2>')[1];
      if (content) {
        // Remove HTML tags (simplified)
        content = content.replace(/<[^>]*>/g, ' ');
        
        // Split content into paragraphs
        const paragraphs = content.split('\n\n');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        paragraphs.forEach(paragraph => {
          // Skip empty paragraphs
          if (!paragraph.trim()) return;
          
          // Process text to fit within page width
          const textLines = doc.splitTextToSize(paragraph.trim(), 170);
          
          // Check if we need a new page
          if (y + (textLines.length * 7) > 280) {
            doc.addPage();
            currentPage++;
            y = 20;
          }
          
          // Add text
          doc.text(textLines, 20, y);
          y += (textLines.length * 7) + 10;
        });
        
        // Add spacing between sections
        y += 10;
        
        // Add a new page for the next section
        if (index < sections.length - 1) {
          doc.addPage();
          currentPage++;
          y = 20;
        }
      }
    }
  });
}

// Generate the PDF
try {
  addCoverPage();
  addContent();
  
  // Save the PDF
  const pdfPath = path.join(__dirname, 'QCallerStudio_Documentation.pdf');
  fs.writeFileSync(pdfPath, doc.output());
  console.log(`PDF saved to ${pdfPath}`);
} catch (error) {
  console.error('Error generating PDF:', error);
}
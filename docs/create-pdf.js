import PDFDocument from 'pdfkit';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a document
const doc = new PDFDocument({
  size: 'A4',
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  },
  info: {
    Title: 'QCaller Studio Documentation',
    Author: 'QCaller Studio Development Team',
    Subject: 'Comprehensive Features Documentation',
    Keywords: 'QCaller, VoIP, SIP, radio automation, studio communication'
  }
});

// Function to add a header to each page
function addHeader(doc, pageNumber, totalPages) {
  doc.fontSize(8)
     .fillColor('#888888')
     .text(`QCaller Studio Documentation`, 50, 20, { align: 'center', width: doc.page.width - 100 })
     .text(`Page ${pageNumber} of ${totalPages}`, 50, doc.page.height - 20, { align: 'center', width: doc.page.width - 100 });
}

// Pipe the PDF to a file
const outputPath = join(__dirname, '../QCallerStudio_Documentation.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Load the markdown file
const markdownPath = join(__dirname, 'QCallerStudio_Documentation.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf8');

// Load the logo
const logoPath = join(__dirname, '../attached_assets/qcaller_logo_v4.png');

// Add cover page
doc.image(logoPath, {
  fit: [200, 200],
  align: 'center',
  valign: 'center'
})
   .moveDown(3)
   .fontSize(24)
   .fillColor('#000000')
   .text('QCaller Studio', { align: 'center' })
   .fontSize(18)
   .text('Comprehensive Features Documentation', { align: 'center' })
   .moveDown(4)
   .fontSize(12)
   .text('Version: 1.0.0', { align: 'center' })
   .text('Date: May 8, 2025', { align: 'center' })
   .text('Author: QCaller Studio Development Team', { align: 'center' });

// Add a new page for the table of contents
doc.addPage();

// Parse the Markdown content into sections by looking for ## headers
const lines = markdownContent.split('\n');
const sections = [];
let currentSection = null;
let currentContent = '';

// Process the markdown line by line
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this is a main section header (## Header)
  if (line.startsWith('## ') && !line.startsWith('### ')) {
    // If we were already collecting a section, save it
    if (currentSection !== null) {
      sections.push({
        title: currentSection,
        content: currentContent.trim()
      });
    }
    
    // Start a new section
    currentSection = line.substring(3).trim();
    currentContent = '';
  } 
  // Skip the main title and top metadata
  else if (line.startsWith('# ') || line.startsWith('![') || line.startsWith('**Version')) {
    continue;
  }
  // Otherwise add to the current section content
  else if (currentSection !== null) {
    currentContent += line + '\n';
  }
}

// Add the last section if there is one
if (currentSection !== null) {
  sections.push({
    title: currentSection,
    content: currentContent.trim()
  });
}

// Function to add a simple TOC
function addTableOfContents(doc, sections) {
  doc.fontSize(16)
     .fillColor('#000000')
     .text('Table of Contents', { align: 'center' })
     .moveDown(1);
  
  sections.forEach((section, index) => {
    // Skip the Table of Contents section itself in the TOC
    if (section.title !== 'Table of Contents') {
      doc.fontSize(12)
         .text(`${index + 1}. ${section.title}`, {
           underline: true,
           continued: false
         })
         .moveDown(0.5);
    }
  });
}

// Add TOC
addTableOfContents(doc, sections);

// Add another page for the start of content
doc.addPage();

// Add each section
sections.forEach((section, index) => {
  // Skip the table of contents section in the content
  if (section.title === 'Table of Contents') {
    return;
  }
  
  // Add page break for each new major section (if not the first one)
  if (index > 0) {
    doc.addPage();
  }
  
  // Add the section header
  doc.fontSize(16)
     .fillColor('#000000')
     .text(section.title, { align: 'left' })
     .moveDown(1);
  
  // Process the content for this section
  const contentLines = section.content.split('\n');
  let currentParagraph = '';
  let inList = false;
  
  contentLines.forEach(line => {
    // Check for subsection headers
    if (line.startsWith('### ')) {
      // First flush any pending paragraph
      if (currentParagraph.trim()) {
        doc.fontSize(12)
           .fillColor('#000000')
           .text(currentParagraph.trim(), {
             paragraphGap: 10,
             lineGap: 5
           })
           .moveDown(1);
        currentParagraph = '';
      }
      
      // Add the subsection header
      doc.fontSize(14)
         .fillColor('#333333')
         .text(line.substring(4).trim(), {
           paragraphGap: 5,
           lineGap: 3
         })
         .moveDown(0.5);
    }
    // Handle list items
    else if (line.trim().startsWith('- ')) {
      // If we were in a paragraph before, flush it
      if (!inList && currentParagraph.trim()) {
        doc.fontSize(12)
           .fillColor('#000000')
           .text(currentParagraph.trim(), {
             paragraphGap: 10,
             lineGap: 5
           })
           .moveDown(1);
        currentParagraph = '';
      }
      
      inList = true;
      // Add the list item
      doc.fontSize(12)
         .fillColor('#000000')
         .text(line.trim().substring(2).trim(), {
           bulletPoint: true,
           bulletRadius: 2,
           lineGap: 3,
           indent: 10,
           align: 'left'
         });
    }
    // Handle regular content
    else if (line.trim() !== '') {
      if (inList) {
        // We're transitioning out of a list
        inList = false;
        doc.moveDown(0.5);
      }
      // Add to the current paragraph
      currentParagraph += line + ' ';
    }
    // Handle empty lines (paragraph breaks)
    else if (line.trim() === '') {
      if (currentParagraph.trim()) {
        // Flush the current paragraph
        doc.fontSize(12)
           .fillColor('#000000')
           .text(currentParagraph.trim(), {
             paragraphGap: 10,
             lineGap: 5
           })
           .moveDown(1);
        currentParagraph = '';
      }
    }
  });
  
  // Flush any remaining paragraph text
  if (currentParagraph.trim()) {
    doc.fontSize(12)
       .fillColor('#000000')
       .text(currentParagraph.trim(), {
         paragraphGap: 10,
         lineGap: 5
       });
  }
});

// No need to switch pages and add headers manually
// PDFKit handles this automatically as we build the document

// Finalize the PDF and end the stream
doc.end();

console.log(`PDF successfully generated at: ${outputPath}`);
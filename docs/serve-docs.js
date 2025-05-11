import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Serve static files from the docs directory
app.use(express.static(__dirname));

// Serve attached_assets directory
app.use('/attached_assets', express.static(join(__dirname, '..', 'attached_assets')));

// Default route redirects to the PDF converter
app.get('/', (req, res) => {
  res.redirect('/pdf-converter.html');
});

// Start the server
app.listen(PORT, () => {
  console.log(`QCaller Studio Documentation server running at http://localhost:${PORT}`);
  console.log(`Open your browser and navigate to http://localhost:${PORT} to view and generate the PDF documentation.`);
});
/**
 * Mazen Studio Installation Helper
 * 
 * This script helps with setting up the local development environment.
 * Run with: node setup.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Mazen Studio Broadcast System Setup ===\n');

// Check if .env file exists, create if it doesn't
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('💡 Creating .env file...');
  
  rl.question('Enter PostgreSQL connection URL (or press Enter for default): ', (dbUrl) => {
    const defaultUrl = 'postgresql://postgres:postgres@localhost:5432/mazenstudio';
    const connectionString = dbUrl || defaultUrl;
    
    const envContent = `DATABASE_URL=${connectionString}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully\n');
    
    installDependencies();
  });
} else {
  console.log('✅ .env file already exists\n');
  installDependencies();
}

function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error installing dependencies:', error);
      process.exit(1);
    }
    
    console.log('✅ Dependencies installed successfully\n');
    setupDatabase();
  });
}

function setupDatabase() {
  console.log('🗄️ Setting up database...');
  
  rl.question('Would you like to run the database migration now? (Y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'n') {
      exec('npm run db:push', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error setting up database:', error);
          console.log('You may need to create the database first or check your connection string in .env');
          finishSetup();
          return;
        }
        
        console.log('✅ Database setup successfully\n');
        finishSetup();
      });
    } else {
      console.log('Skipping database migration\n');
      finishSetup();
    }
  });
}

function finishSetup() {
  console.log(`
✨ Setup Complete ✨

To start the development server:
  npm run dev

Your app will be available at: http://localhost:5000

Thank you for installing Mazen Studio Broadcast System!
  `);
  
  rl.close();
}
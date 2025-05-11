#!/bin/bash
# Mazen Studio Broadcast System - Local PC Startup Script

# Check if the script is running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  echo "This script is running on Windows. Using cross-env for compatibility."
  export NODE_ENV=development
else
  # For Unix-based systems
  export NODE_ENV=development
fi

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "Creating .env from example..."
  cp .env.example .env
  echo "✅ .env file created. Please edit it with your database credentials."
fi

# Check if database exists
if command -v psql &> /dev/null; then
  echo "Checking PostgreSQL database..."
  # Extract database name from DATABASE_URL
  DB_NAME=$(grep DATABASE_URL .env | cut -d'/' -f4)
  
  if [ -z "$DB_NAME" ]; then
    echo "⚠️ Could not extract database name from .env"
    echo "Please ensure your DATABASE_URL is properly formatted."
  else
    # Check if database exists
    if psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
      echo "✅ Database $DB_NAME exists."
    else
      echo "⚠️ Database $DB_NAME does not exist."
      echo "Please create it with: createdb $DB_NAME"
      
      read -p "Create database now? (y/n) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        createdb $DB_NAME
        echo "✅ Database $DB_NAME created successfully!"
      fi
    fi
  fi
else
  echo "⚠️ PostgreSQL command line tools not found."
  echo "Please ensure PostgreSQL is installed and properly configured."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo "✅ Dependencies installed successfully!"
fi

# Run database migrations if needed
read -p "Run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running database migrations..."
  npm run db:push
  echo "✅ Migrations completed!"
fi

# Start the application in development mode
echo "Starting Mazen Studio in development mode..."
npm run dev
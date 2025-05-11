@echo off
:: Mazen Studio Broadcast System - Windows PC Startup Script

echo === Mazen Studio Broadcast System Setup ===

:: Check if .env file exists
if not exist .env (
  echo .env file not found!
  echo Creating .env from example...
  copy .env.example .env
  echo .env file created. Please edit it with your database credentials.
)

:: Check if node_modules directory exists
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  echo Dependencies installed successfully!
)

:: Ask to run database migrations
set /p run_migrations="Run database migrations? (y/n): "
if /i "%run_migrations%"=="y" (
  echo Running database migrations...
  call npm run db:push
  echo Migrations completed!
)

:: Start the application
echo Starting Mazen Studio in development mode...
set NODE_ENV=development
call npm run dev
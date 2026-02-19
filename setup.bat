@echo off
REM Vocabulary Review System - One-Click Setup Script (Windows)
REM This script installs all dependencies and starts the application

echo.
echo ========================================
echo Vocabulary Review System - Setup
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected
node -v
echo.

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)

echo [OK] npm detected
npm -v
echo.

REM Install dependencies
echo Installing dependencies...
echo This may take a few minutes...
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully
echo.

REM Build Electron code
echo Building Electron code...
call npm run build:electron

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build Electron code
    pause
    exit /b 1
)

echo.
echo [OK] Build complete
echo.

REM Success message
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo To start the application, run:
echo   npm run dev
echo.
echo Or double-click this script again with --start
echo.

REM Auto-start if --start flag is provided
if "%1"=="--start" (
    echo Starting application...
    echo.
    call npm run dev
) else (
    pause
)

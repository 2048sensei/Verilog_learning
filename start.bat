@echo off
title Verilog Learning - Launcher
cd /d "%~dp0"

echo ==========================================
echo   Verilog Interactive Learning Site
echo ==========================================
echo.

REM ===== 1. Check Node.js =====
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo Please install it from https://nodejs.org/ and retry.
    echo.
    pause
    exit /b 1
)

REM ===== 2. Install dependencies if missing =====
if not exist "node_modules" (
    echo [INFO] Installing dependencies, please wait...
    echo.
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

REM ===== 3. Build the production bundle if missing =====
if not exist "dist\index.html" (
    echo [INFO] Building site, please wait...
    echo.
    call npm run build
    if errorlevel 1 (
        echo.
        echo [ERROR] Build failed.
        pause
        exit /b 1
    )
)

REM ===== 4. Already running THIS project? Reuse it =====
REM Only reuse when the page actually serves this site (contains "Verilog").
REM Otherwise another project may be occupying 4173 and we must not hijack it.
curl -s --max-time 2 http://localhost:4173/ | findstr /c:"Verilog" >nul 2>nul
if not errorlevel 1 (
    echo [OK] This site is already running, opening browser...
    start "" http://localhost:4173
    exit /b 0
)

REM ===== 5. Find a free port (start at 4173, avoid conflicts with other projects) =====
set PORT=4173
:findport
curl -s -o nul --max-time 1 http://localhost:%PORT%/ >nul 2>nul
if errorlevel 1 goto port_found
set /a PORT+=1
if %PORT% gtr 4200 (
    echo [ERROR] No free port in 4173-4200.
    pause
    exit /b 1
)
goto findport
:port_found

REM ===== 6. Start the production preview server (stable, no HMR) =====
echo [START] http://localhost:%PORT%
echo [INFO]  Keep this window open while using the site.
echo [INFO]  Close it or press Ctrl+C to stop.
echo.
call npm run preview -- --port %PORT% --strictPort --open

echo.
echo Server stopped.
pause

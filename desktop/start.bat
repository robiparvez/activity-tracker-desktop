@echo off
echo 🚀 Activity Tracker Desktop App - Quick Start
echo ==============================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    echo ✅ Dependencies installed
    echo.
)

REM Check if config exists
if not exist "app-config.json" (
    echo ⚙️  Creating default configuration...
    (
        echo {
        echo   "decryptionKey": "",
        echo   "employeeId": ""
        echo }
    ) > app-config.json
    echo ✅ Configuration file created
    echo.
)

echo 🎯 Starting Activity Tracker Desktop App...
echo.
echo 📝 Don't forget to configure your settings on first launch:
echo    - Decryption Key ^(from your ActivityTracker config^)
echo    - Hostname ^(your identifier^)
echo.

call npm run electron:dev

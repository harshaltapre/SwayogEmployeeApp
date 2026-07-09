@echo off
echo ===================================================
echo      SWAYOG CLEAN-TECH ENTERPRISE SERVICE TERMINAL
echo ===================================================
echo.
echo [1/2] Building and verifying Android local build...
cd android-app
call gradlew.bat assembleDebug
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Android build failed! Please check JDK settings or gradle.properties.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
echo [SUCCESS] Android debug build complete!
echo.
echo [2/2] Starting Backend & Frontend servers...
cd ..
echo Launching concurrent services on Ports 3000 (Vite) and 4000 (Express API)...
npm run dev

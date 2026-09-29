@echo off
title E-KAVACH Local Server ^& Domain Launcher
echo ========================================================
echo   E-KAVACH Local Server and Domain Launcher (ekawach.co.in)
echo ========================================================
echo.
echo 1. Starting E-KAVACH server on port 3000...
start "E-KAVACH Server" cmd /k "npm run dev"

timeout /t 4 /nobreak >nul

echo 2. Starting Cloudflare Tunnel for ekawach.co.in...
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run ekawach-local"

echo.
echo ========================================================
echo   E-KAVACH is now running!
echo   - Local Access:  http://localhost:3000
echo   - Live Domain:   https://ekawach.co.in
echo ========================================================
echo Keep both command windows open while hosting.
pause

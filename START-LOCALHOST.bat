@echo off
setlocal
title ReplyForge - Localhost (5173 + 8088)
cd /d "%~dp0"

echo [1/4] Membersihkan proses lama di port 5173 dan 8088...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING" /C:":8088 .*LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 >nul

echo [2/4] Memastikan dependensi terpasang...
if not exist "node_modules" (
  call npm install
)

echo [3/4] Menyalakan API (8088) + Web (5173)...
start "ReplyForge API" cmd /k "npm run dev -w server"
timeout /t 3 >nul
start "ReplyForge Web" cmd /k "npm run dev -w web"

echo [4/4] Menunggu server siap...
timeout /t 8 >nul
start "" http://localhost:5173

echo.
echo ============================================================
echo   UI  : http://localhost:5173      (tampilan seperti APK)
echo   API : http://localhost:8088/api/products
echo ============================================================
echo Tutup dua jendela "ReplyForge API" dan "ReplyForge Web" untuk berhenti.
pause

@echo off
cd /d "%~dp0server"
echo Starting ReplyForge Server on http://localhost:8088 ...
start "" http://localhost:8088
node src/index.js
pause

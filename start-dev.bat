@echo off
echo Starting PKS-DB Development Servers...
echo.

echo [1/2] Starting Backend (Go)...
start "PKS-DB Backend" cmd /k "cd GO && echo Backend starting on http://localhost:3000 && go run cmd/server/main.go"

timeout /t 3 >nul

echo [2/2] Starting Frontend (Next.js)...
start "PKS-DB Frontend" cmd /k "cd my-admin && echo Frontend starting on http://localhost:3001 && npm run dev"

echo.
echo ========================================
echo Both services are starting!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Press any key to close this window (services will keep running)...
pause >nul


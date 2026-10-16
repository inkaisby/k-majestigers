@echo off
title K-Majestigers Localhost Starter
echo ========================================================
echo   K-MAJESTIGERS ELITE KARATE ACADEMY & CHAMPIONSHIP
echo   Menjalankan Sistem Lengkap di Localhost...
echo ========================================================
echo.

:: 1. Jalankan Backend (Port 5001) di jendela terpisah jika belum aktif
echo [1/2] Menjalankan Backend API (Port 5001)...
start "INKAI Backend Server (:5001)" cmd /k "cd /d D:\website\inkai\inkai-backend && npm run dev"

:: Tunggu 3 detik agar backend siap
timeout /t 3 /nobreak >nul

:: 2. Jalankan Frontend (Port 3000)
echo [2/2] Menjalankan Frontend Web Server (Port 3000)...
start "K-Majestigers Frontend (:3000)" cmd /k "cd /d D:\website\majestigers && npx -y serve -l 3000 ."

:: Tunggu 2 detik lalu buka browser otomatis
timeout /t 2 /nobreak >nul
echo Membuka browser: http://localhost:3000
start http://localhost:3000

echo.
echo ========================================================
echo  Layanan telah aktif di Localhost:
echo  - Frontend Web : http://localhost:3000
echo  - Backend API  : http://localhost:5001/api
echo  - Member Portal: http://localhost:3000/member
echo  - Dojo Portal  : http://localhost:3000/dojo
echo  - Admin Portal : http://localhost:3000/admin
echo ========================================================

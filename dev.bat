@echo off
chcp 65001 > nul
title SafShekan Dev Server
echo =====================================================================
echo   ⚡ صف‌شکن (SafShekan) - اجرای یکپارچه در خط فرمان (CMD)
echo =====================================================================
echo.
echo 🌐 داشبورد وب:       http://localhost:3000
echo 🔌 بک‌اند NestJS:    http://localhost:3880
echo 📖 مستندات Swagger:  http://localhost:3880/api/docs
echo.
echo در حال اجرای Turbo Dev...
pnpm dev

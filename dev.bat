@echo off
chcp 65001 > nul
title SafShekan Dev Server
echo =====================================================================
echo   ⚡ صف‌شکن (SafShekan) - اجرای یکپارچه در خط فرمان (CMD)
echo =====================================================================
echo.
echo 🌐 همه چیز (وب + API):  http://localhost:3000
echo 📖 مستندات Swagger:     http://localhost:3000/api/docs
echo.
echo در حال اجرای Turbo Dev...
pnpm dev

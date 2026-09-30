@echo off
REM Windows batch script for deploying website

echo 🚀 Bắt đầu quá trình deploy website...
echo.

REM Kiểm tra Firebase CLI
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI chưa được cài đặt!
    echo 💡 Cài đặt bằng lệnh: npm install -g firebase-tools
    pause
    exit /b 1
)

echo ✅ Firebase CLI đã sẵn sàng

REM Kiểm tra đăng nhập Firebase
firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo ❌ Chưa đăng nhập Firebase!
    echo 💡 Đăng nhập bằng lệnh: firebase login
    pause
    exit /b 1
)

echo ✅ Đã đăng nhập Firebase

REM Build và deploy
echo 📦 Chuẩn bị files cho deploy...
echo.

REM Kiểm tra các file quan trọng
if not exist "index.html" (
    echo ❌ Thiếu file: index.html
    pause
    exit /b 1
)

if not exist "admin.html" (
    echo ❌ Thiếu file: admin.html
    pause
    exit /b 1
)

if not exist "firebase-config.js" (
    echo ❌ Thiếu file: firebase-config.js
    pause
    exit /b 1
)

if not exist "js\main.js" (
    echo ❌ Thiếu file: js\main.js
    pause
    exit /b 1
)

echo ✅ Tất cả file quan trọng đã sẵn sàng

REM Deploy Firestore rules nếu có
if exist "firestore.rules" (
    echo 📋 Deploy Firestore rules...
    firebase deploy --only firestore:rules
)

REM Deploy Storage rules nếu có
if exist "storage.rules" (
    echo 📁 Deploy Storage rules...
    firebase deploy --only storage
)

REM Deploy Hosting
echo 🌐 Deploy website...
firebase deploy --only hosting

if errorlevel 0 (
    echo.
    echo 🎉 Deploy thành công!
    echo.
    echo 📝 Checklist sau deploy:
    echo    ☐ Kiểm tra website hoạt động bình thường
    echo    ☐ Test form liên hệ
    echo    ☐ Đăng nhập admin panel
    echo    ☐ Seed dữ liệu mẫu nếu cần
) else (
    echo ❌ Deploy thất bại!
    echo 💡 Kiểm tra lỗi ở trên và thử lại
)

echo.
pause
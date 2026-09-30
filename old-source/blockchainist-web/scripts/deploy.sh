#!/bin/bash

# Script tự động deploy website lên Firebase Hosting
# Cách sử dụng: ./deploy.sh hoặc bash deploy.sh

echo "🚀 Bắt đầu quá trình deploy website..."
echo ""

# Kiểm tra Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI chưa được cài đặt!"
    echo "💡 Cài đặt bằng lệnh: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI đã sẵn sàng"

# Kiểm tra đăng nhập Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Chưa đăng nhập Firebase!"
    echo "💡 Đăng nhập bằng lệnh: firebase login"
    exit 1
fi

echo "✅ Đã đăng nhập Firebase"

# Build và deploy
echo "📦 Chuẩn bị files cho deploy..."
echo ""

# Kiểm tra các file quan trọng
required_files=("index.html" "admin.html" "firebase-config.js" "js/main.js" "js/admin.js")
missing_files=()

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        missing_files+=("$file")
    fi
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo "❌ Thiếu các file quan trọng:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo "✅ Tất cả file quan trọng đã sẵn sàng"

# Deploy Firestore rules nếu có
if [[ -f "firestore.rules" ]]; then
    echo "📋 Deploy Firestore rules..."
    firebase deploy --only firestore:rules
fi

# Deploy Storage rules nếu có
if [[ -f "storage.rules" ]]; then
    echo "📁 Deploy Storage rules..."
    firebase deploy --only storage
fi

# Deploy Hosting
echo "🌐 Deploy website..."
firebase deploy --only hosting

if [[ $? -eq 0 ]]; then
    echo ""
    echo "🎉 Deploy thành công!"
    echo ""
    echo "🔗 Website của bạn đã được deploy tại:"
    firebase hosting:channel:list | grep -E "(live|Live)" | head -1
    echo ""
    echo "👉 Để xem trực tiếp, chạy: firebase open hosting:site"
    echo ""
    echo "📝 Checklist sau deploy:"
    echo "   ☐ Kiểm tra website hoạt động bình thường"
    echo "   ☐ Test form liên hệ" 
    echo "   ☐ Đăng nhập admin panel"
    echo "   ☐ Seed dữ liệu mẫu nếu cần"
else
    echo "❌ Deploy thất bại!"
    echo "💡 Kiểm tra lỗi ở trên và thử lại"
    exit 1
fi
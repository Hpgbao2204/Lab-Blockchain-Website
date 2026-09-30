# Nhóm Nghiên cứu Blockchain, Mạng & Bảo mật# Nhóm Nghiên cứu Blockchain, Mạng & Bảo mật



## Cấu trúc thư mụcWebsite chính thức của nhóm nghiên cứu chuyên về công nghệ Blockchain, Mạng và An ninh mạng.



```## 🚀 Tính năng

📁 blockchainist-web/

├── 📁 config/                 # File cấu hình- **Trang chủ động**: Hiển thị thông tin về nhóm nghiên cứu

│   ├── firebase-config.js- **Quản lý thành viên**: Tự động load thành viên từ Firebase

│   ├── cloudinary-config.js- **Công bố khoa học**: Hiển thị các nghiên cứu đã được công bố

│   ├── firestore.rules- **Form liên hệ**: Tiếp nhận hồ sơ ứng tuyển với upload file

│   ├── firestore.indexes.json- **Admin Panel**: Quản lý toàn bộ nội dung website

│   └── storage.rules- **Firebase Integration**: Lưu trữ dữ liệu real-time

├── 📁 src/                    # Source code- **Responsive Design**: Tương thích trên mọi thiết bị

│   ├── 📁 js/                 # JavaScript files

│   │   ├── main.js## 🛠️ Công nghệ sử dụng

│   │   ├── cloudinary-storage.js

│   │   └── admin-cloudinary.js- **Frontend**: HTML5, CSS3, JavaScript (ES6+)

│   ├── 📁 css/                # Stylesheet files- **UI Framework**: Tailwind CSS

│   │   └── styles.css- **Backend**: Firebase (Firestore, Storage, Auth)

│   └── 📁 assets/             # Static assets- **Animation**: AOS (Animate On Scroll)

├── 📁 admin/                  # Admin panel- **Icons**: Lucide Icons

│   └── admin.html- **3D Effects**: Three.js

├── 📁 scripts/                # Build & deployment scripts

│   ├── deploy.sh## 📦 Cài đặt và Chạy

│   ├── deploy.bat

│   └── seed-data.js### 1. Clone repository

├── index.html                 # Main website```bash

├── 404.html                   # Error pagegit clone <repository-url>

├── firebase.json              # Firebase configurationcd blockchainist-web

└── README.md                  # This file```

```

### 2. Cấu hình Firebase

## Công nghệ sử dụng1. Tạo project Firebase tại [Firebase Console](https://console.firebase.google.com/)

2. Cấu hình Firestore Database

- **Frontend**: HTML5, CSS3, JavaScript ES6+, Tailwind CSS3. Thiết lập Firebase Storage

- **Backend**: Firebase Firestore4. Bật Authentication (Email/Password)

- **Authentication**: Firebase Auth5. Cập nhật `firebase-config.js` với thông tin dự án của bạn

- **Image Hosting**: Cloudinary CDN

- **Icons**: Lucide Icons### 3. Thiết lập Collections trong Firestore

- **Animations**: AOS (Animate On Scroll)

#### Collection: `members`

## Tính năng```javascript

{

- ✅ Hiển thị thông tin nhóm nghiên cứu  name: "Tên thành viên",

- ✅ Profile chi tiết từng thành viên  role: "Chức vụ", 

- ✅ Quản lý ứng tuyển online  avatar: "URL avatar"

- ✅ Admin panel với Cloudinary upload}

- ✅ Tối ưu hóa ảnh tự động```

- ✅ Responsive design

- ✅ SEO friendly#### Collection: `publications`

```javascript

## Cài đặt và triển khai{

  title: "Tiêu đề bài báo",

### 1. Clone repository  authors: "Danh sách tác giả",

```bash  journal: "Tên tạp chí",

git clone https://github.com/MonUITVN23/blockchainist-web.git  year: 2025,

cd blockchainist-web  abstract: "Tóm tắt nghiên cứu",

```  url: "Link đến bài báo"

}

### 2. Cấu hình Firebase```

- Tạo project Firebase mới

- Copy cấu hình vào `config/firebase-config.js`#### Collection: `applications` (tự động tạo khi có form submission)

- Thiết lập Firestore rules từ `config/firestore.rules````javascript

{

### 3. Cấu hình Cloudinary  name: "Họ tên",

- Tạo tài khoản Cloudinary  email: "Email",

- Copy cấu hình vào `config/cloudinary-config.js`  school: "Trường học",

- Thiết lập upload presets  phone: "Số điện thoại",

  message: "Thư ngỏ",

### 4. Deploy  cvUrl: "Link CV",

```bash  transcriptUrl: "Link bảng điểm",

# Linux/Mac  timestamp: "Thời gian gửi"

./scripts/deploy.sh}

```

# Windows

scripts/deploy.bat### 4. Tạo tài khoản Admin

Sử dụng Firebase Console để tạo user admin:

# Hoặc deploy với Firebase1. Vào Authentication

firebase deploy2. Thêm user mới với email/password

```3. Sử dụng thông tin này để đăng nhập admin panel



## Access Points### 5. Deploy



- **Website chính**: `index.html`#### Sử dụng Firebase Hosting (Khuyên dùng)

- **Admin Panel**: `admin/admin.html````bash

- **Error Page**: `404.html`# Cài đặt Firebase CLI

npm install -g firebase-tools

## Liên hệ

# Đăng nhập

- Website: [blockchainist-web.web.app]firebase login

- Email: contact@blockchain-research.com

# Khởi tạo hosting

## Licensefirebase init hosting



MIT License - xem file LICENSE để biết thêm chi tiết.# Deploy
firebase deploy
```

#### Sử dụng các dịch vụ khác
- **Netlify**: Kéo thả folder vào Netlify Dashboard
- **Vercel**: Import từ GitHub repository  
- **GitHub Pages**: Push lên GitHub và bật Pages

## 🔧 Cấu trúc thư mục

```
/
├── index.html              # Trang chủ
├── admin.html              # Trang quản trị
├── firebase-config.js      # Cấu hình Firebase
├── css/
│   └── styles.css         # Custom styles (nếu cần)
├── js/
│   ├── main.js            # JavaScript cho trang chủ
│   └── admin.js           # JavaScript cho admin panel
└── README.md
```

## 🎨 Tùy chỉnh

### Thay đổi màu sắc chủ đạo
Sửa các class Tailwind trong HTML:
- `text-sky-400` → `text-blue-400` (thay đổi màu accent)
- `bg-sky-500` → `bg-blue-500` (thay đổi màu nút)

### Thêm section mới
1. Thêm HTML section mới
2. Cập nhật navigation menu
3. Thêm animation AOS nếu cần

### Thay đổi font chữ
Cập nhật Google Fonts import trong `<head>` và CSS custom.

## 📱 Tương thích

- ✅ Chrome/Edge/Firefox (phiên bản mới)
- ✅ Mobile Safari/Chrome
- ✅ Responsive breakpoints: sm, md, lg, xl
- ✅ Dark mode ready

## 🔒 Bảo mật

- Firebase Security Rules được cấu hình
- Admin authentication required
- File upload validation
- XSS protection

## 📞 Hỗ trợ

Nếu có vấn đề gì trong quá trình setup hoặc deploy:
1. Kiểm tra Firebase configuration
2. Xem Console logs để debug
3. Đảm bảo Firestore rules đúng
4. Kiểm tra CORS settings nếu có lỗi

## 📄 License

© 2025 Nhóm Nghiên cứu Blockchain, Mạng & Bảo mật. All rights reserved.
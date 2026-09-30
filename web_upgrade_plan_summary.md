# Tóm tắt kế hoạch nâng cấp website Blockchainist

## 1. Web hiện tại có gì?

Web hiện tại là một **landing page giới thiệu nhóm nghiên cứu Blockchain, Mạng & Bảo mật**.

Các phần đang có:

```txt
- Header / Navbar
- Hero section: “KIẾN TẠO TƯƠNG LAI SỐ”
- Lĩnh vực nghiên cứu
- Thành viên nhóm
- Công bố khoa học
- Tuyển dụng / Gia nhập nhóm
- Form liên hệ / ứng tuyển
- Modal profile thành viên
- Modal chi tiết bài báo
- Admin panel cơ bản
```

Về kỹ thuật, web hiện tại đang dùng:

```txt
- HTML/CSS/JavaScript thuần
- Tailwind CDN
- Firebase / Firestore
- Firebase Auth
- Cloudinary để lưu ảnh
- AOS animation
- Lucide icons
```

Dữ liệu hiện tại:

```txt
- Members lấy từ Firestore nếu có
- Publications lấy từ Firestore nếu có
- Applications/contact form lưu vào Firestore
- Ảnh dùng Cloudinary hoặc placeholder
```

Vấn đề hiện tại:

```txt
- Web còn giống demo/landing page hơn là website học thuật chính thức
- Nhiều dữ liệu vẫn là placeholder/mẫu
- Thành viên mẫu như Nguyễn Văn A, Trần Thị B
- Công bố khoa học chưa hiển thị tốt hoặc đang “đang tải”
- Chưa fetch dữ liệu thật từ ORCID
- UI còn generic, chưa đủ academic/professional
- Backend còn đơn giản, chưa có sync data tự động
- Admin panel chưa đủ mạnh để thầy tự quản lý nội dung dễ dàng
```

---

## 2. Yêu cầu của thầy là gì?

Thầy muốn **nâng cấp toàn diện website**:

```txt
- Nâng cấp UI/UX
- Nâng cấp Frontend
- Nâng cấp Backend
- Fetch dữ liệu học thuật từ ORCID
- Làm web chuyên nghiệp hơn cho nhóm nghiên cứu
```

Nguồn dữ liệu thầy muốn dùng:

```txt
ORCID:
https://orcid.org/0000-0003-1156-7072
```

Mục tiêu chính của thầy có thể hiểu là:

```txt
- Web nhìn chuyên nghiệp hơn
- Hiển thị đúng profile học thuật của thầy/nhóm
- Công bố khoa học được lấy từ ORCID thay vì nhập tay
- Dễ cập nhật dữ liệu
- Dễ quản lý members, projects, publications
- Có form liên hệ/tuyển thành viên hoạt động tốt
```

---

## 3. Chúng ta định nâng cấp gì?

### 3.1. Nâng UI/UX

Chuyển web từ kiểu landing page demo sang kiểu:

```txt
Academic Research Group Website / Lab Website
```

Các phần UI mới nên có:

```txt
- Hero section chuyên nghiệp hơn
- Professor / Principal Investigator profile
- Research areas rõ ràng
- Research impact stats
- Featured publications
- All publications page
- Members page
- Projects page
- Join us / Recruitment page
- Contact page
```

UI nên mang vibe:

```txt
Academic + Research + Modern Tech + Trustworthy
```

---

### 3.2. Nâng Frontend

Đề xuất rewrite sang:

```txt
Next.js + TypeScript + Tailwind CSS + shadcn/ui
```

Thay vì tiếp tục HTML/JS thuần.

Lý do:

```txt
- Code dễ maintain hơn
- Có nhiều page riêng
- SEO tốt hơn
- Dễ fetch data
- Dễ chia component
- Dễ deploy
- Dễ mở rộng admin/dashboard
```

Các page dự kiến:

```txt
/
/publications
/members
/projects
/join
/contact
/admin
```

---

### 3.3. Nâng Backend/Data

Hiện tại vẫn có thể giữ Firebase, nhưng làm lại backend/data flow rõ hơn.

Stack đề xuất:

```txt
Frontend: Next.js
Database: Firebase Firestore
Auth: Firebase Auth
Backend/API: Next.js API routes hoặc Firebase Cloud Functions
Media: Cloudinary
Data source: ORCID
```

Dữ liệu cần quản lý:

```txt
- members
- publications
- projects
- applications
- siteSettings
```

---

### 3.4. ORCID integration

Thay vì nhập publications thủ công, sẽ làm chức năng:

```txt
Sync publications từ ORCID
```

Flow dự kiến:

```txt
Admin bấm “Sync ORCID”
        ↓
Backend gọi ORCID API
        ↓
Lấy danh sách publications
        ↓
Normalize dữ liệu
        ↓
Lưu vào Firestore
        ↓
Frontend hiển thị publications
```

Nếu có DOI thì có thể nâng cấp thêm:

```txt
ORCID → DOI → Crossref/OpenAlex → enrich metadata
```

Tức là lấy thêm:

```txt
- journal/conference
- publisher
- abstract
- citation count
- link bài báo
- open access link
```

---

### 3.5. Admin dashboard

Làm admin dashboard để thầy hoặc người quản trị có thể:

```txt
- Quản lý members
- Quản lý projects
- Quản lý publications
- Sync ORCID publications
- Xem applications/contact submissions
- Chỉnh nội dung homepage
- Upload ảnh thành viên/banner
```

---

## 4. Plan dự tính update

Team có 2 người, chia như sau:

```txt
Người 1: Frontend/UI/UX
Người 2: Backend/Data/Admin/ORCID
```

---

## 5. Timeline dự kiến

### Tuần 1 — Setup nền tảng

Frontend:

```txt
- Tạo project Next.js + TypeScript
- Setup Tailwind + shadcn/ui
- Tạo layout chính
- Tạo header/footer
- Tạo design system cơ bản
- Làm skeleton homepage
```

Backend:

```txt
- Setup Firebase project
- Thiết kế Firestore schema
- Setup Firebase Auth
- Tạo collections cơ bản
- Seed data thật bước đầu
- Test kết nối Firestore
```

Kết quả:

```txt
- Project mới chạy được
- Firebase kết nối được
- Homepage skeleton có layout
- Có schema database rõ ràng
```

---

### Tuần 2 — Homepage + Publications + ORCID

Frontend:

```txt
- Hoàn thiện homepage
- Làm Professor Profile section
- Làm Research Areas section
- Làm Featured Publications section
- Làm Publications page
- Làm search/filter/sort UI
```

Backend:

```txt
- Viết hàm fetch ORCID works
- Normalize dữ liệu ORCID
- Lưu publications vào Firestore
- Tạo API/manual action sync ORCID
- Xử lý duplicate bằng DOI hoặc ORCID put-code
```

Kết quả:

```txt
- Homepage đẹp hơn
- Publications lấy được dữ liệu thật từ ORCID
- Có thể sync lại dữ liệu khi cần
```

---

### Tuần 3 — Members, Projects, Admin

Frontend:

```txt
- Làm Members page
- Làm Member detail
- Làm Projects page
- Làm Project detail
- Làm Contact/Join page
- Làm UI admin dashboard
```

Backend:

```txt
- CRUD members
- CRUD projects
- CRUD site settings
- Lưu applications từ form
- Setup Cloudinary upload
- Cập nhật Firestore security rules
```

Kết quả:

```txt
- Admin có thể quản lý nội dung cơ bản
- Members/projects không cần sửa code thủ công
- Form liên hệ hoạt động
```

---

### Tuần 4 — Polish, QA, Deploy

Frontend:

```txt
- Tối ưu responsive
- Fix UI spacing/typography
- Loading/empty/error states
- SEO metadata
- Lighthouse/performance
- Animation polish
```

Backend:

```txt
- Chống spam form
- Kiểm tra security rules
- Setup production deploy
- Setup environment variables
- Backup/restore data
- Viết README hướng dẫn sử dụng
```

Kết quả:

```txt
- Web production-ready
- Deploy domain thật
- Có tài liệu bàn giao cho thầy
- Thầy/admin có thể quản lý nội dung
```

---

## 6. MVP cần đạt

Bản đầu tiên nên có:

```txt
- Trang chủ mới, không còn placeholder
- Thông tin thầy chính xác
- Publications lấy từ ORCID
- Publications page có search/filter
- Members page
- Projects page
- Join/contact form
- Admin dashboard cơ bản
- Responsive mobile tốt
- Deploy production
```

---

## 7. Ưu tiên làm trước

Thứ tự ưu tiên:

```txt
1. Setup Next.js project
2. Setup Firebase schema
3. Làm homepage mới
4. Làm ORCID publications sync
5. Làm publications page
6. Làm members/projects
7. Làm admin dashboard
8. Làm contact form
9. SEO + deploy + polish
```

Điểm quan trọng nhất để demo cho thầy là:

```txt
Homepage mới + publications thật từ ORCID
```

Vì đây là phần thể hiện rõ nhất web đã được nâng cấp từ demo sang website học thuật thật.

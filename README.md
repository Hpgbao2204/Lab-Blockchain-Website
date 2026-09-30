# Blockchainist Lab Web

Website của nhóm nghiên cứu Blockchain, Mạng & Bảo mật — `blockchainist.id.vn`.

- **Public**: thành tích, công bố khoa học (đồng bộ từ ORCID), giải thưởng, core members và trang CV từng thành viên.
- **Private**: tường theo nhóm/tháng để giao việc, comment, theo dõi tiến độ. Chỉ tài khoản do admin tạo mới truy cập được.

Trạng thái: **đang xây lại từ đầu**. Xem kế hoạch và milestone tại [`docs/ROADMAP.md`](docs/ROADMAP.md), kiến trúc tại [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), thiết kế tại [`docs/DESIGN.md`](docs/DESIGN.md).

Nội dung site: tiếng Anh. Trang: `/research`, `/publications`, `/people`, `/pioneers`, `/join`, `/developers` (API công khai `/api/v1`).

Stack: Next.js + TypeScript + Tailwind v4, Drizzle + Postgres (PGlite khi chạy local), Three.js.

```bash
npm install
ADMIN_PASSWORD=admin-password-123 npm run db:seed -- --demo   # admin + dữ liệu demo
npm run dev                                                     # http://localhost:3000/login
```

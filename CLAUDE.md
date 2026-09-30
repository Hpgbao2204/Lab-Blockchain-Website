# CLAUDE.md

Dự án: website nhóm nghiên cứu Blockchainist (public showcase + tường riêng tư theo nhóm/tháng). Đang **rebuild từ đầu**; code cũ đã xoá (xem commit `a7c69da` nếu cần tham khảo).

Bắt đầu mỗi session:

1. Đọc `docs/ROADMAP.md` — mục *Trạng thái* cho biết milestone hiện tại và việc tiếp theo.
2. Đọc `docs/ARCHITECTURE.md` (schema, API, phân quyền) và `docs/DESIGN.md` (style giống portfolio `hpgbao2204/hpgbao2204`, sáng + 3D, nội dung site toàn tiếng Anh).
3. Làm theo milestone; cuối mỗi milestone chạy `npm run lint && npm run typecheck && npm run test && npm run build`, cập nhật ROADMAP, commit.

Quy tắc:

- Không đăng ký công khai; chỉ admin tạo tài khoản. Tường riêng tư bảo vệ bằng kiểm tra quyền phía server (`src/server/services`), mỗi luật có test.
- Không commit secrets (`DATABASE_URL`, mật khẩu admin). Chạy local không cần DB: PGlite tự tạo ở `.data/`.
- Giao tiếp với chủ dự án bằng tiếng Việt; code, tên biến, commit bằng tiếng Anh.
- Phát triển trên nhánh được giao cho session. Chủ dự án đã uỷ quyền: tự push và mở PR (draft) khi xong một phần việc.

# Hướng dẫn quản trị website Blockchainist

Dành cho thầy (tài khoản admin `dungtrt@uit.edu.vn`). Website: https://blockchainist.id.vn

Nội dung hiển thị công khai trên site là tiếng Anh, nên tin tức, bài báo… thầy nhập bằng tiếng Anh.

## 1. Đăng nhập lần đầu

1. Vào https://blockchainist.id.vn/login, nhập email và **mật khẩu tạm** (bạn Bảo gửi riêng).
2. Site bắt đổi mật khẩu ngay (ít nhất 10 ký tự). Đổi xong là vào được trang quản trị.
3. Quên mật khẩu: nhờ người quản lý Vercel đặt biến `ADMIN_RESET=1` rồi deploy lại; mật khẩu tạm mới nằm trong build log (xem `docs/DEPLOY.md`).

Thanh menu phía trên (sau khi đăng nhập) có các mục bên dưới.

## 2. Accounts: tài khoản và nhóm

- **Tạo tài khoản**: nhập email (cũng là email nhận thông báo), họ tên, chức danh, vai trò *member* hoặc *admin* → site tự **gửi email chào mừng** (tiếng Việt) tới địa chỉ đó, kèm username, mật khẩu tạm và link đăng nhập để kích hoạt và cập nhật hồ sơ. Mật khẩu tạm cũng hiện trên màn hình một lần, phòng khi email chưa tới. Bỏ tick *Email the username…* nếu không muốn gửi. Không có đăng ký công khai.
- Nhiều bạn làm chung một paper: tạo tài khoản riêng cho từng bạn, rồi thêm tất cả vào cùng một group (một wall). Thiếu bạn nào thì tạo và thêm sau.
- **Reset** khi thành viên quên mật khẩu (mật khẩu tạm mới được gửi qua email); **Deactivate** khi thành viên rời lab (không đăng nhập được, không nhận email nữa).
- **Groups**: mỗi nhóm thường là một paper. Đặt tên, paper, hội nghị/tạp chí, deadline nộp; chọn thành viên và **lead** (lead được giao việc, ghim link Overleaf/GitHub cho nhóm).
- Nút **Profile** cạnh mỗi tài khoản: sửa hộ trang CV của thành viên.

## 3. Meetings: họp lab và thông báo

- **Schedule a meeting**: ngày giờ (giờ Việt Nam), phòng, link online, ghi chú, chọn người trình bày + chủ đề. Danh sách người trình bày xếp theo ai lâu chưa trình bày nhất.
- Tick *Email every member now* để gửi email cho cả lab. 07:00 sáng ngày họp site tự gửi email nhắc.
- **Edit / swap presenter** khi đổi người, có thể gửi lại email.
- **Announcements**: thông báo chung, hiện trên trang của mọi thành viên, tuỳ chọn gửi email.

## 4. News: tin tức trên trang công khai

1. **Write a news item** → chọn loại: *News*, *Award* (giải thưởng), *Paper accepted* (bài được nhận), *Event*.
2. Nhập ngày, tiêu đề, tóm tắt 1–2 câu (hiện trên thẻ tin), nội dung đầy đủ (tuỳ chọn, cách đoạn bằng một dòng trống), link (bài báo, trang sự kiện).
3. **Publish**. Tin hiện ở `/news`, 3 tin mới nhất hiện trên trang chủ.
- Bỏ tick *Published* để lưu nháp (chỉ admin thấy). Chọn ngày trong tương lai thì đến ngày đó tin mới hiện.
- **Edit** / **Delete** trên từng tin. Đổi tiêu đề thì đường link của tin cũng đổi.

## 5. Applications: đơn xin vào lab

- Sinh viên điền form ở `/join` (họ tên, email, chương trình học, hướng quan tâm, giới thiệu bản thân, link GitHub/CV).
- Đơn mới hiện ở **Applications** và trên trang Accounts (*N new applications waiting*). Khi đã bật email, admin nhận email cho mỗi đơn mới.
- Mỗi đơn có: **Reply by email** (mở thư trả lời), **Status** (*New → Contacted → Accepted / Declined*), **Private note** (ghi chú riêng, tự lưu khi bấm ra ngoài ô), **Delete**.
- Nhận người: đổi status *Accepted*, rồi tạo tài khoản cho họ ở mục Accounts.

## 6. Publications: danh sách bài báo

- Danh sách gốc lấy tự động từ Crossref theo ORCID của thầy.
- **Add a paper**: thêm bài Crossref chưa có (ví dụ bài vừa được nhận): tiêu đề, tên ngắn (vd. *Lotus*), năm, loại, tác giả (mỗi dòng một người), nơi đăng, DOI hoặc link. Hướng nghiên cứu: tick chọn, hoặc để trống để site tự đoán theo tiêu đề.
- **Hide / Show**: ẩn bài không muốn hiện (bài Crossref chỉ ẩn được, không sửa được). Bài thêm tay thì **Edit** / **Delete** được.
- Ô lọc giúp tìm nhanh theo tiêu đề, tác giả, năm.

## 7. Report và Monday email

- **Report**: báo cáo tháng theo nhóm và thành viên (việc xong, trễ hạn, còn mở), tải CSV hoặc in ra PDF.
- **Monday email**: xem trước email nhắc việc gửi mỗi sáng thứ Hai 08:00 cho từng thành viên, có nút gửi thử.

## 8. Khi email chưa chạy

Email (họp, thông báo, nhắc việc, đơn ứng tuyển) cần cấu hình Resend (`docs/DEPLOY.md` bước 6). Khi chưa có, trang quản trị ghi rõ *Email is not set up*; mọi thứ khác vẫn hoạt động.

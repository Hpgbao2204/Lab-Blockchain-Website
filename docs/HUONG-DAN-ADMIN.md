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
- Nút **Profile** cạnh mỗi tài khoản: sửa hộ trang của thành viên. Mỗi người chọn trang `/people/<tên>` hiện gì: trang CV (4 kiểu: Classic, Minimal, Spotlight, Cards, cùng màu nhấn), **website riêng hiển thị ngay trong trang** (ví dụ GitHub Pages), hoặc chuyển thẳng sang website đó. Website nào không cho nhúng (Notion, LinkedIn…) thì site tự chuyển hướng.

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

- Sinh viên điền form ở `/join`. Một nhóm làm chung chỉ nộp **một đơn**: chọn số người (1 đến 6), mỗi người điền đủ họ tên (tự lưu thành tiếng Việt không dấu), mã số sinh viên, email, số điện thoại, Zalo, Facebook. Ô nào cũng bắt buộc. Cả nhóm điền chung chương trình học, hướng quan tâm, phần giới thiệu.
- Đơn mới hiện ở **Applications** và trên trang Accounts (*N new applications waiting*). Admin nhận email cho mỗi đơn mới (có đủ thông tin từng người); bấm **Reply** ngay trong email là thư đi thẳng tới người đứng tên đơn.
- Trả lời trên site: ở thẻ đơn chọn **Accept** (nhận), **Decline** (từ chối) hoặc **Just reply** (chỉ nhắn, ví dụ hẹn phỏng vấn). Site điền sẵn một lời nhắn mẫu tiếng Việt, thầy sửa tuỳ ý rồi bấm **Send**: mọi người trong đơn nhận email, họ bấm Reply là thư về email của thầy. Chưa quyết thì bấm **Later**.
- **Accept tự tạo tài khoản**: khi Accept, ô *Create N accounts and email the login details* được tick sẵn. Mỗi người có một tài khoản (username là email, mật khẩu tạm ngẫu nhiên) và nhận email chào mừng tiếng Việt như khi tạo tay. Ai đã có tài khoản thì giữ nguyên. Thẻ đơn ghi *account created* cạnh từng người. Sau đó thầy chỉ cần thêm họ vào group ở Accounts.
- **Status** chỉnh tay được (*New → Contacted → Accepted / Declined*), **Private note** là ghi chú riêng, **Delete** xoá đơn. Đổi Status bằng ô chọn thì không tạo tài khoản; khi đó dùng nút **Create their account** (mở Accounts với tên và email điền sẵn).
- Chống spam: form có ô "I am human" của Cloudflare (khi đã cấu hình, xem `docs/DEPLOY.md` bước 7b), mỗi địa chỉ IP gửi tối đa 3 đơn/giờ, và nếu có hơn 20 đơn trong 1 giờ thì site ngừng gửi email báo đơn (đơn vẫn được lưu).

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

# Đưa site lên domain thật

Hướng dẫn go-live cho `blockchainist.id.vn` (đổi tên miền nếu dùng domain khác). Bí mật (mật khẩu DB, API key, `CRON_SECRET`) chỉ đặt trong **Environment Variables của Vercel** hoặc environment secrets, không dán vào chat, không commit.

## Chọn hạ tầng (đều có gói miễn phí)

| Thành phần | Khuyên dùng | Vì sao |
|---|---|---|
| Hosting | **Vercel** (Hobby, dự án phi thương mại) | Next.js chạy sẵn, HTTPS tự động, có cron |
| Postgres | **Neon** (region Singapore `aws-ap-southeast-1`), cài qua Vercel Marketplace | Không bị pause/xoá như Supabase free; Vercel tự điền `DATABASE_URL` |
| File đính kèm | **Cloudflare R2** (10 GB free, không tính phí tải xuống) | Ổ đĩa của Vercel không lưu lâu dài. Driver S3 trong code cho trình duyệt upload/tải thẳng qua URL ký ngắn hạn (5 phút), vượt giới hạn 4.5 MB/request của Vercel |
| Email | **Resend** + domain đã xác thực | Email nhắc việc thứ Hai |

Supabase (Postgres + Storage có S3 API trong 1 tài khoản) cũng được, nhưng project free bị pause sau ~1 tuần ít hoạt động. Dịch vụ tương thích S3 nào cũng dùng được với cùng các biến `S3_*`.

> ⚠️ Không đặt `S3_*` thì file lưu vào ổ đĩa server (chỉ hợp cho chạy local): trên Vercel file sẽ mất và file > ~4.5 MB sẽ lỗi.

## Các bước

1. **Vercel**: *Add New → Project* → import `Hpgbao2204/Lab-Blockchain-Website`, nhánh `master`. Framework: Next.js, không cần sửa lệnh build.
2. **Database**: trong project Vercel → *Storage → Neon → Create* (region Singapore) → *Connect* để Vercel thêm `DATABASE_URL` (pooled) và `DATABASE_URL_UNPOOLED`.
3. **Biến môi trường** (Vercel → *Settings → Environment Variables*, môi trường Production):
   - `NEXT_PUBLIC_SITE_URL` = `https://blockchainist.id.vn`
   - `ADMIN_EMAIL` = `hpgbao@gmail.com`, `ADMIN_NAME` = tên hiển thị
   - `CRON_SECRET` = chuỗi ngẫu nhiên dài (vd. `openssl rand -hex 32`); Vercel Cron tự gửi `Authorization: Bearer $CRON_SECRET`
   - `RESEND_API_KEY`, `MAIL_FROM` = `Blockchainist <noreply@blockchainist.id.vn>` (sau bước Email)
   - `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (sau bước File)
4. **Tạo bảng + admin** (một lần, từ máy có repo; dùng URL *unpooled* cho migration):
   ```bash
   vercel env pull .env.production.local --environment=production
   set -a; source .env.production.local; set +a
   DATABASE_URL="$DATABASE_URL_UNPOOLED" npm run db:migrate
   DATABASE_URL="$DATABASE_URL_UNPOOLED" npm run db:seed    # in mật khẩu tạm của admin, đổi ngay khi đăng nhập
   ```
   Không chạy `--demo` trên production. Mỗi lần thêm migration mới: chạy lại `npm run db:migrate` trước khi deploy.
5. **Domain**: Vercel → *Settings → Domains* → thêm `blockchainist.id.vn` và `www.blockchainist.id.vn` (redirect về apex). Ở trang quản lý DNS của nhà đăng ký, tạo đúng các bản ghi Vercel hiển thị, thường là:
   | Loại | Tên | Giá trị |
   |---|---|---|
   | A | `@` | `216.198.79.1` (IP Vercel đang khuyên dùng; `76.76.21.21` cũ vẫn chạy) |
   | CNAME | `www` | giá trị Vercel hiển thị (dạng `xxxx.vercel-dns-017.com`, hoặc `cname.vercel-dns.com`) |
   Xoá bản ghi A/AAAA/CNAME cũ trùng tên (trang "parking" của nhà đăng ký). Đợi Vercel báo *Valid Configuration*, HTTPS tự cấp.

   **Trường hợp `blockchainist.id.vn` hiện tại** (kiểm tra 02/10/2026): domain đăng ký ở **Tenten** dưới tài khoản của người khác, và bản ghi A đã trỏ về Vercel (`216.198.79.1`), đang chạy site tĩnh cũ (repo Firebase `blockchainist-web`). Nghĩa là domain đang gắn vào một project Vercel khác. Để chuyển sang site này:
   1. Chủ project Vercel cũ vào *Settings → Domains* và **Remove** `blockchainist.id.vn` + `www` (site cũ tắt từ lúc này).
   2. Thêm domain vào project Vercel của site này. Nếu Vercel báo domain thuộc tài khoản khác, nó sẽ hiện 1 bản ghi TXT `_vercel` để xác minh: nhờ người giữ tài khoản Tenten thêm bản ghi đó.
   3. Không cần đổi bản ghi A. Chỉ cần thêm/sửa CNAME `www` và các bản ghi email Resend (bước 6) trong trang quản lý DNS của Tenten.
   Site mới **không dùng Firebase**: không cần Firebase config hay API key.
6. **Email (Resend)**: *Domains → Add* `blockchainist.id.vn` (region gần nhất, vd. Tokyo) → thêm các bản ghi Resend hiển thị vào DNS: TXT DKIM `resend._domainkey`, MX + TXT SPF cho subdomain `send`. Thêm DMARC: TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:hpgbao@gmail.com`. Khi *Verified* → tạo API key → điền `RESEND_API_KEY`, `MAIL_FROM` → redeploy → thử ở `/admin/reminders`.
7. **File (Cloudflare R2)**: Cloudflare → *R2 → Create bucket* `blockchainist-files` (không bật public access). *Manage R2 API Tokens → Create*, quyền *Object Read & Write* chỉ cho bucket đó → điền `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; `S3_ENDPOINT` = `https://<account-id>.r2.cloudflarestorage.com`, `S3_BUCKET` = `blockchainist-files`. Trong bucket → *Settings → CORS policy*:
   ```json
   [{ "AllowedOrigins": ["https://blockchainist.id.vn"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```
   Redeploy, rồi thử upload một PDF > 5 MB trên wall.
8. **Kiểm tra sau deploy**: `/api/v1/health`, đăng nhập admin, tạo 1 nhóm + task thử, `https://blockchainist.id.vn/robots.txt` và `/sitemap.xml`, dán link vào Facebook/Zalo xem ảnh chia sẻ.
9. **Google**: Search Console → thêm domain (bản ghi TXT xác minh) → gửi `https://blockchainist.id.vn/sitemap.xml`.

## Vận hành

- Cron `vercel.json`: email việc thứ Hai 01:00 UTC (08:00 VN) và nhắc họp hằng ngày 00:00 UTC (07:00 VN). Gói Hobby có thể lệch trong vòng 1 giờ.
- Backup: Neon có point-in-time restore ngắn hạn; nên `pg_dump "$DATABASE_URL_UNPOOLED" > backup.sql` hàng tháng.
- Chuyển admin sang thầy: tạo tài khoản admin cho `dungtrt@uit.edu.vn` trong `/admin`, thầy đăng nhập và đổi mật khẩu, rồi hạ quyền tài khoản cũ nếu muốn.

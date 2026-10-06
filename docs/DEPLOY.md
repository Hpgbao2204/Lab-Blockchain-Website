# Đưa site lên domain thật

Hướng dẫn go-live cho `blockchainist.net` (domain chính từ 06/10/2026, DNS ở Cloudflare; domain cũ `blockchainist.id.vn` chuyển hướng về đây, xem bước 5b). Bí mật (mật khẩu DB, API key, `CRON_SECRET`) chỉ đặt trong **Environment Variables của Vercel** hoặc environment secrets, không dán vào chat, không commit.

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
   - `NEXT_PUBLIC_SITE_URL` = `https://www.blockchainist.net` (đúng domain chính, không có `/` cuối; link trong email, sitemap, robots, ảnh chia sẻ đều lấy từ đây)
   - `ADMIN_EMAIL` = `hpgbao@gmail.com`, `ADMIN_NAME` = tên hiển thị
   - `CRON_SECRET` = chuỗi ngẫu nhiên dài (vd. `openssl rand -hex 32`); Vercel Cron tự gửi `Authorization: Bearer $CRON_SECRET`
   - `RESEND_API_KEY`, `MAIL_FROM` = `Blockchainist <noreply@blockchainist.id.vn>` (sau bước Email; địa chỉ gửi không cần trùng domain website, xem bước 6)
   - `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (sau bước File)
   - `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (captcha form /join, bước 7b)
4. **Tạo bảng + admin: tự động**, không cần gõ lệnh. Mỗi lần Vercel build, script `vercel-build` (`scripts/deploy-db.ts`) chạy migration rồi tạo admin nếu chưa có. Chỉ cần **Redeploy** sau khi đã có `DATABASE_URL`.
   - Đặt sẵn `ADMIN_PASSWORD` (Environment Variables, Production) nếu muốn tự chọn mật khẩu admin. Không đặt thì mật khẩu tạm được in ra **build log** (Deployments → bản mới nhất → *Build Logs*, tìm dòng `[deploy-db] Admin created`), đăng nhập rồi đổi ngay.
   - **Quên / không thấy mật khẩu admin** (log ghi `Admin already exists`): thêm biến `ADMIN_RESET` = `1` (chỉ môi trường Production) → Redeploy → build log có dòng `[deploy-db] ADMIN_RESET: <email> temporary password: …` → đăng nhập, đổi mật khẩu → **xoá biến `ADMIN_RESET`** (để nguyên thì lần deploy sau lại đặt lại mật khẩu).
   - **Xoá sạch dữ liệu, làm lại từ đầu**: đặt `RESET_DATABASE` = một giá trị mới (vd. ngày hôm nay `2026-10-03`, chỉ Production) → Redeploy. Build sẽ xoá hết tài khoản, nhóm, wall, họp, hồ sơ **một lần** cho giá trị đó, rồi tạo lại admin theo `ADMIN_EMAIL` (mặc định `dungtrt@uit.edu.vn`) và in mật khẩu tạm. Deploy sau với cùng giá trị không xoá nữa. Không hoàn tác được.
   - Kiểm tra: build log có `[deploy-db] Migrations applied.`; mở `/login` đăng nhập được.
   - Chạy tay (không bắt buộc), từ máy có repo: `vercel env pull .env.production.local --environment=production`, nạp biến rồi `npx tsx scripts/deploy-db.ts`. Không chạy `db:seed --demo` trên production.
5. **Domain cũ `blockchainist.id.vn` (Tenten, ghi lại để tham khảo)**: Vercel → *Settings → Domains* → thêm `blockchainist.id.vn` và `www.blockchainist.id.vn` (redirect về apex). Ở trang quản lý DNS của nhà đăng ký, tạo đúng các bản ghi Vercel hiển thị, thường là:
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

5b. **Domain chính `blockchainist.net` (DNS ở Cloudflare)**:
   1. Vercel → *Settings → Domains → Add* `blockchainist.net`, giữ tick *Redirect apex domains to www*, *Connect to an environment: Production*. Domain chính là **`www.blockchainist.net`**; `blockchainist.net` tự chuyển hướng 308 sang www (cấu hình đang dùng từ 06/10/2026).
   2. Cloudflare → *DNS → Records*: thêm đúng bản ghi Vercel hiển thị (hiện là CNAME `@` và CNAME `www` cùng trỏ về giá trị dạng `xxxx.vercel-dns-017.com`; Cloudflare tự "flatten" CNAME ở `@`). Mỗi bản ghi để **DNS only** (đám mây xám), không bật Proxied, để Vercel tự cấp HTTPS. Đợi *Valid Configuration*.
   3. Domain cũ: ở Vercel, sửa `blockchainist.id.vn` và `www.blockchainist.id.vn` thành *Redirect to Another Domain* → `www.blockchainist.net` (308), để link cũ (email đã gửi, bài đăng Facebook) vẫn mở được. Vẫn gia hạn `blockchainist.id.vn` hằng năm khi email còn gửi từ domain này.
   4. Đổi `NEXT_PUBLIC_SITE_URL` (bước 3), thêm domain mới vào Turnstile (bước 7b) và CORS của R2 (bước 7), rồi **Redeploy**.
6. **Email (Resend)**: *Domains → Add* `blockchainist.id.vn` (domain gửi mail hiện tại; website đổi sang `blockchainist.net` không ảnh hưởng, Resend không cần chỉnh gì) (region gần nhất, vd. Tokyo) → thêm các bản ghi Resend hiển thị vào DNS: TXT DKIM `resend._domainkey`, MX + TXT SPF cho subdomain `send`. Thêm DMARC: TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:hpgbao@gmail.com`. Khi *Verified* → tạo API key → điền `RESEND_API_KEY`, `MAIL_FROM` → redeploy → thử ở `/admin/reminders`.
   **Chuyển email sang `blockchainist.net` (khi muốn, không bắt buộc):** Resend → *Domains → Add* `blockchainist.net` → thêm các bản ghi nó hiển thị vào Cloudflare DNS (TXT `resend._domainkey`, MX + TXT cho `send`, để DNS only), thêm TXT `_dmarc` như trên → đợi *Verified* → đổi `MAIL_FROM` = `Blockchainist <noreply@blockchainist.net>` → Redeploy → gửi thử. Gói free của Resend cho 1 domain: xác minh xong domain mới thì xoá domain cũ trong Resend. Nếu trên Cloudflare đã có MX của dịch vụ mail khác ở `@` thì không sao, bản ghi của Resend nằm ở subdomain `send`.
7. **File (Cloudflare R2)**: Cloudflare → *R2 → Create bucket* `blockchainist-files` (không bật public access). *Manage R2 API Tokens → Create*, quyền *Object Read & Write* chỉ cho bucket đó → điền `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; `S3_ENDPOINT` = `https://<account-id>.r2.cloudflarestorage.com`, `S3_BUCKET` = `blockchainist-files`. Trong bucket → *Settings → CORS policy*:
   ```json
   [{ "AllowedOrigins": ["https://blockchainist.net", "https://www.blockchainist.net", "https://blockchainist.id.vn"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```
   Redeploy, rồi thử upload một PDF > 5 MB trên wall.
7b. **Captcha form /join (Cloudflare Turnstile, miễn phí)**: Cloudflare → *Turnstile → Add widget* → tên `blockchainist-join`, hostname `blockchainist.net` và `www.blockchainist.net` (giữ `blockchainist.id.vn`; thêm `localhost` nếu muốn thử ở máy; widget đã tạo thì vào *Settings → Hostname Management* để thêm, key không đổi). Thiếu hostname thì captcha báo lỗi và **không ai gửi được form**, widget mode *Managed* → *Create*. Copy **Site Key** vào `TURNSTILE_SITE_KEY` (tên cũ `NEXT_PUBLIC_TURNSTILE_SITE_KEY` vẫn chạy) và **Secret Key** vào `TURNSTILE_SECRET_KEY` (Production) → Redeploy. Thiếu một trong hai thì captcha tắt hẳn, form vẫn gửi được. Chưa đặt hai biến này thì form vẫn chạy, chỉ còn honeypot + giới hạn 3 đơn/giờ/IP; quá 20 đơn/giờ thì admin không nhận thêm email báo đơn (đơn vẫn lưu).
7c. **Daily desk (bot viết bài mỗi ngày, miễn phí)**: cần ít nhất một nhà cung cấp AI; đặt cả hai thì bot dùng Gemini trước, lỗi thì chuyển sang cái kia.
   - **Gemini**: Google AI Studio (aistudio.google.com) → *Get API key* → tạo key trong project **không gắn billing** (cột *Plan* ghi *Free tier*; project trả trước hết tiền sẽ báo lỗi 402). Đặt `GEMINI_API_KEY`. Tuỳ chọn `GEMINI_MODEL` = danh sách model cách nhau dấu phẩy, thử lần lượt (mặc định `gemini-flash-latest,gemini-flash-lite-latest`).
   - **OpenRouter / Groq / Zhipu GLM / DeepSeek… (API kiểu OpenAI)**: đặt `AI_API_KEY`, `AI_BASE_URL` (vd `https://openrouter.ai/api/v1`) và `AI_MODEL` (danh sách cách nhau dấu phẩy; với OpenRouter chọn model có đuôi `:free`).
   - Model bận/hết hạn mức (429, 5xx) được thử lại 1 lần rồi chuyển sang model tiếp theo. Không có key nào thì bot vẫn lấy tin về `/admin/desk`, chỉ không viết bài. Redeploy sau khi đổi biến. Gói miễn phí có thể dùng dữ liệu gửi lên để cải thiện model (chỉ là tin công khai nên không sao).
8. **Kiểm tra sau deploy**: `/api/v1/health`, đăng nhập admin, tạo 1 nhóm + task thử, `https://www.blockchainist.net/robots.txt` và `/sitemap.xml`, dán link vào Facebook/Zalo xem ảnh chia sẻ.
9. **Google**: Search Console → thêm domain (bản ghi TXT xác minh) → gửi `https://www.blockchainist.net/sitemap.xml`. Đổi từ domain cũ: thêm cả hai domain rồi dùng *Settings → Change of address* ở property `blockchainist.id.vn`.

## Lỗi thường gặp

- Log Vercel báo `mkdir '.data/pglite'` hoặc `DATABASE_URL is not set`, `/login` và `/api/v1/me` lỗi 500: project chưa có database. Làm bước 2 (Storage → Neon → *Connect*, tick cả Production), kiểm tra *Settings → Environment Variables* có `DATABASE_URL`, rồi **Redeploy** (biến môi trường chỉ có hiệu lực từ lần deploy sau). Redeploy cũng tự tạo bảng và admin (bước 4).
- Trang công khai (Home, Research, Publications…) vẫn chạy khi chưa có database vì chúng là trang tĩnh; chỉ đăng nhập, wall, admin và /people cần database.

## Vận hành

- Cron `vercel.json`: email việc thứ Hai 01:00 UTC (08:00 VN), nhắc họp hằng ngày 00:00 UTC (07:00 VN) và daily desk 23:00 UTC (06:00 VN, lấy tin + viết 1 bài nháp, tối đa 5 phút). Gói Hobby có thể lệch trong vòng 1 giờ.
- Backup: Neon có point-in-time restore ngắn hạn; nên `pg_dump "$DATABASE_URL_UNPOOLED" > backup.sql` hàng tháng.
- Chuyển admin sang thầy: tạo tài khoản admin cho `dungtrt@uit.edu.vn` trong `/admin`, thầy đăng nhập và đổi mật khẩu, rồi hạ quyền tài khoản cũ nếu muốn.

# Roadmap & Milestones — Blockchainist Lab Web (rebuild)

> File này là nguồn sự thật để **tiếp tục làm ở session mới** khi session cũ hết token.
> Bắt đầu session mới: đọc `CLAUDE.md` → file này (mục *Trạng thái*) → `docs/ARCHITECTURE.md` → `docs/DESIGN.md`.
> Mỗi khi xong một milestone: tick checklist, cập nhật bảng *Trạng thái*, commit.

## Mục tiêu

Website nhóm nghiên cứu Blockchain (domain `blockchainist.net`) gồm 2 tầng:

1. **Public** — trang quảng bá: thành tích, bài báo (từ ORCID), giải thưởng, core members; mỗi member có thể có trang CV/portfolio riêng (ai có CV thì gắn, không có thì thôi).
2. **Private (cần đăng nhập)** — "tường" theo nhóm. Mỗi tháng thầy (admin) tạo nhóm, gắn thành viên; thầy note/giao việc cho 1 người, vài người hoặc cả nhóm; member comment, cập nhật trạng thái, đính kèm file. Cảm giác như trang cá nhân Facebook.

Ràng buộc đã chốt với chủ dự án:

- Có **tài khoản admin** cho thầy. **Chỉ admin tạo được account**; không có đăng ký công khai. Chưa đăng nhập thì không vào được phần private.
- **Database miễn phí**.
- UI sáng, blockchain, liên chuỗi, **3D** (Three.js/R3F), nền chân dung các tiền nhân; font riêng, không dùng lại font cũ. Xem `docs/DESIGN.md`.
- Dữ liệu core members do thầy cung cấp (import từ CSV/JSON, không hard-code).
- Backend phải là **API** (REST `/api/v1`), không chỉ là landing page.
- Code cũ (Next.js + Firebase) đã xoá; còn ở commit `a7c69da` để tham khảo (ORCID client/normalize, Turnstile, Resend, zod validation).

## Stack chốt

| Lớp | Lựa chọn | Ghi chú |
|---|---|---|
| Web + API | Next.js (App Router) + TypeScript, Route Handlers `/api/v1/*` | 1 app duy nhất, dễ vận hành với 2 người |
| Style | Tailwind CSS v4 + tokens trong `globals.css` | |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` (import động, client only) | fallback khi không có WebGL / `prefers-reduced-motion` |
| DB + Auth + Storage | **Supabase** (Postgres + Auth + Storage, free tier) | RLS bảo vệ tường riêng tư |
| Validation | zod | |
| Test | vitest (+ Playwright smoke cho luồng chính) | |
| Hosting | Vercel (Hobby) + domain `blockchainist.net` | |
| Chống spam form liên hệ | Cloudflare Turnstile | dùng lại ý tưởng từ code cũ |

Lưu ý free tier (kiểm tra lại số liệu hiện hành trước khi dựa vào): Supabase free tự **pause project nếu không hoạt động ~1 tuần** → thêm cron ping (GitHub Actions) ở M6; email mặc định của Supabase bị giới hạn rate rất thấp → **không phụ thuộc email** để tạo account (admin tạo user kèm mật khẩu tạm, bắt đổi khi đăng nhập lần đầu).

## Thông tin cần từ chủ dự án (để bắt đầu)

Đánh dấu ✅ khi đã có.

- [ ] Tạo project **Supabase** (region Singapore) → lấy `URL`, `anon key`, `service_role key`, `DB password`. Khuyến nghị đặt vào **environment secrets** của môi trường Claude Code / Vercel, không dán vào chat hay commit.
- [ ] Tài khoản **Vercel** đã import repo; trỏ DNS `blockchainist.net` (hoặc cho biết nhà đăng ký domain để hướng dẫn).
- [x] **Email admin**: tạm thời `hpgbao@gmail.com` (Bao), sau này đổi sang thầy `dungtrt@uit.edu.vn` (chốt 01/10/2026).
- [ ] **Tên nhóm, logo, tagline, lĩnh vực nghiên cứu** (3–6 mục) — có thể lấy lại từ bản cũ nếu đúng.
- [ ] **Danh sách core members** (thầy cung cấp; hiện dùng 10 hồ sơ mẫu có nhãn "sample"): tối thiểu `họ tên, vai trò/chức danh, email, ảnh, link (scholar/orcid/github), có CV công khai không`. Định dạng CSV/Google Sheet đều được.
- [ ] **Giải thưởng / thành tích** muốn khoe (hoặc để trống, admin nhập sau).
- [ ] ORCID của thầy: `0000-0003-1156-7072` (lấy từ code cũ — xác nhận). ORCID Public API client id/secret nếu muốn sync ổn định (có thể bắt đầu không cần, dùng public API).
- [x] Ngôn ngữ: **chỉ tiếng Anh** (chốt 30/09/2026).
- [x] Tường có **upload file** (PDF, ảnh, ≤ 10 MB/file). Tên đơn vị "UIT – VNU-HCM" đã xác nhận.
- [ ] Email nhắc deadline thứ Hai (Resend): code xong, cần `RESEND_API_KEY`, `MAIL_FROM` (domain đã xác thực), `CRON_SECRET` khi deploy.

## Trạng thái

| Milestone | Nội dung | Kích thước | Trạng thái |
|---|---|---|---|
| M0 | Scaffold, tooling, CI (deploy Vercel hoãn theo yêu cầu) | S | ✅ xong (chạy localhost) |
| M1 | Design system + hero 3D + shell public | M | ✅ xong; M1.5 redesign tiếng Anh + nhiều trang + API đọc |
| M2 | DB schema, Auth, admin tạo user | L | ✅ xong (Drizzle + Postgres/PGlite, auth tự viết) |
| M3 | Public content: members/CV, publications (ORCID), awards | L | ✅ publications (Crossref + admin thêm/ẩn), CV thành viên, News (giải thưởng, bài được nhận) |
| M4 | Admin console | M | ✅ tài khoản, nhóm, họp, News, đơn ứng tuyển, publications |
| M5 | Tường riêng tư theo nhóm/tháng | L | ✅ wall, bảng việc theo tuần, comment, link Overleaf/GitHub, nơi nộp, file đính kèm |
| M6 | Polish, SEO, a11y, hardening, bàn giao | M | ⬜ |
| M7 | (tuỳ chọn) thông báo, lịch, tìm kiếm | — | 🟡 email thứ Hai + báo cáo tháng (CSV/in PDF) xong |

Chạy thử: `npm install && npm run dev` → http://localhost:3000.

**Cập nhật 01/10/2026 (PR #3):**
- Site tiếng Anh, style portfolio, nhiều trang + API `/api/v1` (xem `docs/DESIGN.md`, `docs/ARCHITECTURE.md`).
- Logo mới: khối lập phương vàng/xanh viền mực (`public/brand/logo-mark.svg`, `logo-lockup.svg`, favicon). Logo PNG cũ (sai chính tả) đã bỏ.
- Publications: 30 bài của thầy lấy từ Crossref theo ORCID + 3 bài IEEE/MAPR thêm tay (`src/data/publications.extra.json`), tự gắn hướng nghiên cứu theo từ khoá. Làm mới: `npm run sync:publications` (cần mạng tới api.crossref.org).
- **Đổi stack DB/Auth**: Drizzle + Postgres (PGlite local), auth tự viết. Lý do trong `docs/ARCHITECTURE.md`.
- Khu thành viên: `/login`, đổi mật khẩu bắt buộc, `/app` (việc của tôi, nhóm của tôi), `/app/groups/[id]` (bảng việc theo tuần: This week/Next week/Later/Done, hạn nộp paper đếm ngược, wall + announcement ghim, comment), `/admin` (tạo tài khoản + mật khẩu tạm, reset, vô hiệu, role; tạo/lưu trữ nhóm, gán thành viên/lead).

**Cập nhật 01/10/2026 (round 3):**
- Admin mặc định `hpgbao@gmail.com` (`ADMIN_EMAIL`), sau đổi sang thầy. Hiện "UIT – VNU-HCM" ở hero, footer, People, metadata.
- 10 thành viên mẫu trên /people (nhãn *sample*, không tính vào stats); `--demo` tạo tài khoản cho họ + 2 nhóm.
- Wall: link nhóm (Overleaf, repo, call for papers; chỉ admin/lead ghim), nơi nộp (journal/conf) trên task, link + file trên từng task (member gắn cho task của mình), khu Files. Bảng `links`, `attachments`, cột `tasks.venue`, `tasks.completed_at` (migration `0001`).
- File: PDF/PNG/JPEG/GIF/WebP, kiểm tra theo nội dung (magic bytes), ≤ 10 MB, tải qua `/api/v1/attachments/:id` có kiểm tra nhóm. Lưu ở `UPLOAD_DIR` (mặc định `.data/uploads`); production dùng driver S3 (`S3_*`).
- Email thứ Hai 08:00 (VN): `/api/v1/cron/weekly-digest` (Bearer `CRON_SECRET`, `vercel.json` cron `0 1 * * 1`), gửi qua Resend; xem trước + gửi tay ở `/admin/reminders`.
- Báo cáo tháng `/admin/reports?month=YYYY-MM`: theo nhóm và thành viên (xong, trễ hạn, còn mở, quá hạn, hoạt động), tải CSV, in/lưu PDF.

**Chạy thử local:** `npm install && ADMIN_PASSWORD=admin-password-123 npm run db:seed -- --demo && npm run dev` → đăng nhập `dungtrt@uit.edu.vn` / `admin-password-123` (thành viên mẫu, vd. `minh.anh.le@blockchainist.local` (lead), `tuan.kiet.bui@blockchainist.local` / `demo-password-123`).

**Còn dở / cần quyết:**
- Deploy: cần một Postgres (khuyên Supabase hoặc Neon free, region Singapore) + Vercel. Đặt `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_NAME` vào environment secrets, không dán vào chat.
- Chuyển admin sang `dungtrt@uit.edu.vn` khi ổn định.
- Roster thành viên thật (tên, vai trò, ảnh, link) thay 10 hồ sơ mẫu.
- Tạo bucket R2 + CORS khi deploy (xem `docs/DEPLOY.md`).
- Email: domain gửi đã xác thực + Resend key.
- Chưa đo Lighthouse / hiệu năng 3D trên GPU thật.

**Cập nhật 01/10/2026 (review trước go-live):**
- Header bảo mật (HSTS, chống iframe, nosniff, Referrer/Permissions-Policy), `robots.txt`, `sitemap.xml`, ảnh chia sẻ OG.
- Đổi mật khẩu thì đăng xuất mọi phiên cũ; giới hạn đăng nhập thêm theo tài khoản.
- Hướng dẫn go-live: `docs/DEPLOY.md` (Vercel + Neon + Cloudflare R2 + Resend, DNS).
- Rate limit đăng nhập lưu trong Postgres (bảng `rate_limits`, migration `0002`), dùng chung giữa các instance serverless.
- File: driver S3 (`S3_*`, khuyên Cloudflare R2); trình duyệt upload/tải thẳng qua URL ký 5 phút (`POST groups/:id/attachments/direct`, rồi `POST groups/:id/attachments` với `{ key, name }`), server kiểm tra lại kích thước + magic bytes trước khi nhận. Không có `S3_*` thì vẫn lưu ổ đĩa như cũ.

**Cập nhật 01/10/2026 (họp lab, theo yêu cầu thầy):**
- `/admin/meetings`: admin lên lịch buổi họp (ngày giờ VN, phòng, link online, ghi chú), chọn người trình bày (+ chủ đề); danh sách gợi ý ai lâu chưa trình bày nhất. Sửa/đổi người trình bày, gửi lại email, xoá.
- Thông báo chung toàn lab (title + nội dung), tuỳ chọn gửi email cho mọi tài khoản đang hoạt động.
- Email gửi tới chính email đăng nhập của tài khoản (admin tạo account = đã gắn email). Người trình bày nhận dòng "You are presenting". Cron hằng ngày 07:00 VN nhắc buổi họp trong ngày (`/api/v1/cron/meeting-reminders`).
- `/app`: thẻ "Lab meetings" (nổi bật buổi mình trình bày) + "Announcements".
- Chạy local không có Resend: email được ghi ra `.data/outbox/*.html` để mở xem. Bảng `meetings`, `meeting_presenters`, `announcements` (migration `0003`). Demo seed có 3 buổi họp + 1 thông báo.

**Cập nhật 01/10/2026 (CV / portfolio thành viên):**
- Mỗi thành viên tự sửa hồ sơ ở `/account/profile` (admin sửa hộ qua nút *Profile* trong danh sách tài khoản): chọn **portfolio riêng** (thẻ trên /people trỏ thẳng tới site họ tự thiết kế) hoặc **CV trên site** (Education, Research & experience, Projects, Awards) với 2 template *Classic* / *Minimal* + 8 màu nhấn; xem trước trực tiếp. Chỉ hiện công khai khi tick "Show on the People page".
- `/people` lấy PI từ `src/data/people.ts` + hồ sơ đã publish trong DB; 10 hồ sơ mẫu tự ẩn khi đã có hồ sơ thật. Trang `/people/[slug]` (cả PI). Ảnh: link ảnh hoặc tự lấy ảnh GitHub. Bảng `profiles` (migration `0004`). API `/api/v1/profiles/:userId|me`, `/api/v1/members` không trả email.
- Demo seed: hồ sơ CV cho 10 thành viên mẫu + tài khoản `gia.bao.huynh@blockchainist.local` link portfolio thật của Bao.

**Cập nhật 03/10/2026 (go-live + tính năng còn lại):**
- Site chạy ở https://blockchainist.net (Vercel + Neon). `RESET_DATABASE` xoá sạch dữ liệu một lần; admin production là thầy `dungtrt@uit.edu.vn` (mật khẩu tạm in trong build log).
- **News** (`/news`, `/news/[slug]`, 3 tin mới nhất trên trang chủ, sitemap): admin viết ở `/admin/news`; loại News/Award/Paper accepted/Event, bản nháp, hẹn ngày đăng. Bảng `news`.
- **Ứng tuyển**: form trên `/join` (giới hạn 3 lần/giờ/IP, honeypot chống bot), admin xem ở `/admin/applications` (trạng thái, ghi chú riêng, trả lời qua email), email báo admin khi có đơn mới. Bảng `applications`.
- **Publications do admin quản lý**: `/admin/publications` thêm bài Crossref chưa có (DOI hoặc link), sửa/xoá bài thêm tay, ẩn/hiện mọi bài. Bảng `publication_entries`, `hidden_publications` (migration `0005`). Nếu DB lỗi, trang public vẫn hiện bản Crossref.
- Hướng dẫn cho thầy: `docs/HUONG-DAN-ADMIN.md`.

**Cập nhật 05/10/2026:** tạo tài khoản (và reset mật khẩu) tự gửi email tiếng Việt cho người đó: username, mật khẩu tạm, link đăng nhập để kích hoạt (theo mẫu thầy gửi). Cần Resend đã xác thực domain.

**Cập nhật 05/10/2026 (trang thành viên + trả lời đơn):**
- `/people/<tên>` theo lựa chọn của thành viên: trang CV ở site (4 template: classic, minimal, spotlight, cards), **hiển thị luôn website riêng** (iframe toàn màn hình dưới thanh lab), hoặc chuyển thẳng sang website. Site từ chối bị nhúng (`X-Frame-Options`, CSP `frame-ancestors`) hoặc không truy cập được thì tự chuyển hướng (`src/server/services/portfolio-frame.ts`, cache 30 phút). Thẻ trên /people luôn trỏ về `/people/<tên>`.
- Form /join thêm Facebook, Zalo. Email báo đơn mới có Reply-To = người nộp. Admin trả lời ngay trên thẻ đơn (Accept / Decline / Just reply + lời nhắn): email gửi người nộp với Reply-To = admin, đổi status, lưu lịch sử trong `applications.replies`. Đơn đã nhận có nút *Create their account* (điền sẵn tên, email ở /admin).

**Cập nhật 05/10/2026 (đơn theo nhóm + tự tạo tài khoản):** form /join cho cả nhóm 1–6 người, mọi ô bắt buộc (họ tên lưu không dấu, MSSV, email, điện thoại, Zalo, Facebook). Admin Accept trên site thì tạo tài khoản cho từng người (username = email, mật khẩu tạm) và gửi email chào mừng. Captcha Cloudflare Turnstile (`TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`; Vercel không cho đặt tiền tố `NEXT_PUBLIC_`, tên cũ vẫn chạy), chặn email báo đơn khi >20 đơn/giờ. Trang chủ: "Explore the research group".

**Cập nhật 05/10/2026 (chấm đỏ My wall):** nút *My wall* (thanh trên, menu mobile, thanh trong /app) hiện chấm đỏ đếm việc mới như thông báo Facebook: task mới hoặc bị đổi, bài viết, bình luận, link, file do **người khác** làm, cộng họp lab và thông báo mới. Mốc "đã xem" lưu ở bảng `wall_reads` (mỗi nhóm một dòng, `lab` cho họp/thông báo); mở /app xoá phần lab, mở tường nhóm xoá phần nhóm đó. Thẻ nhóm ở /app cũng có chấm riêng. API `GET|POST /api/v1/me/activity`, làm mới mỗi phút khi tab đang mở.

**Cập nhật 06/10/2026 (domain mới):** domain chính đổi sang `blockchainist.net` (thầy mua, DNS ở Cloudflare); `blockchainist.id.vn` chuyển hướng về đó. Code không còn hardcode domain (footer email trả lời đơn lấy từ `NEXT_PUBLIC_SITE_URL`). Email vẫn gửi từ `noreply@blockchainist.id.vn` cho tới khi chuyển Resend (`docs/DEPLOY.md` bước 5b, 6).

**Bước tiếp theo:** Resend (email) và Cloudflare R2 (file) theo `docs/DEPLOY.md` bước 6–7; roster thành viên thật; đo Lighthouse.

## Milestones

Quy tắc chung: mỗi milestone = 1–2 session, kết thúc bằng `npm run lint && npm run typecheck && npm run test && npm run build` xanh, commit, cập nhật mục *Trạng thái*.

### M0 — Scaffold (S)

- [x] `create-next-app` (TS, App Router, Tailwind v4, ESLint), vitest, prettier.
- [x] `.env.example` (Supabase, Turnstile, `NEXT_PUBLIC_SITE_URL`), `.gitignore` thêm `supabase/.temp`.
- [x] Font: ban đầu Bricolage/Fraunces/Red Hat Mono; **M1.5 đổi sang Unbounded / Space Grotesk / JetBrains Mono** cho giống portfolio.
- [x] CI (GitHub Actions): lint + typecheck + test + build.
- [ ] Deploy lên Vercel, trỏ domain (hoãn, làm khi sẵn sàng).
- **Xong khi**: `/` hiển thị trang placeholder trên domain thật, CI xanh.

### M1 — Design system + shell public (M)

- [x] Tokens (`docs/DESIGN.md`) → Tailwind theme + CSS variables.
- [x] Component nền: Nav kính, Footer, Section heading, Reveal, Brand (Button/Badge/Stat tile: làm khi cần ở M3–M5).
- [x] **Hero 3D**: hai chuỗi, Alice/Bob/relay, gói tin HTLC, chân dung nền; lazy-load, fallback, reduced-motion.
- [x] Trang chủ với dữ liệu mẫu (hero, hướng nghiên cứu, tiền nhân, publications, CTA). Members/stats: chờ M3.
- [x] Responsive (đã kiểm tra 390/820/1440); skip link; focus ring; `prefers-reduced-motion`.
- **Xong khi**: trang chủ đẹp, Lighthouse perf ≥ 90 mobile với hero 3D lazy.

### M2 — Database, Auth, admin tạo user (L)

- [ ] `supabase/migrations/*.sql` theo `docs/ARCHITECTURE.md` (profiles, member_cvs, publications, awards, site_settings, groups, group_members, posts, tasks, task_assignees, comments, attachments).
- [ ] RLS: public đọc nội dung published; tường chỉ cho member của nhóm + admin.
- [ ] Tắt đăng ký công khai (Supabase Auth: disable signups). `@supabase/ssr` cho session cookie.
- [ ] `/login`, đổi mật khẩu bắt buộc lần đầu (`must_change_password`), logout, middleware bảo vệ `/app/*` và `/admin/*`.
- [ ] `POST /api/v1/admin/users` (service role, chỉ admin): tạo user + profile + mật khẩu tạm.
- [ ] Script seed: tạo admin đầu tiên từ `ADMIN_EMAIL`; script import core members từ CSV/JSON.
- [ ] Test RLS (SQL tests hoặc integration) cho: anon không đọc được tường; member nhóm A không đọc được nhóm B.
- **Xong khi**: admin đăng nhập, tạo được user, user đăng nhập/đổi mật khẩu; anon bị chặn đúng.

### M3 — Public content (L)

- [ ] Members: danh sách + lọc; trang `/members/[slug]` = CV nếu `member_cvs.published`, nếu không chỉ thẻ thông tin cơ bản.
- [ ] Publications: sync ORCID (`lib/orcid`: fetch works → normalize → upsert theo `(source, external_id)`/DOI; tham khảo code cũ ở `a7c69da`), trang `/publications` có tìm kiếm/lọc năm/loại, bài nổi bật trên trang chủ. Liên kết tác giả ↔ profile theo tên chuẩn hoá.
- [ ] Awards/thành tích + stats trang chủ tính từ DB.
- [ ] Cron (Vercel Cron hoặc GitHub Actions) sync ORCID định kỳ + nút sync tay ở admin.
- [ ] `GET /api/v1/{members,publications,awards,stats}` công khai, có cache (đã có bản đọc dữ liệu tĩnh từ M1.5; chuyển sang DB).
- **Xong khi**: trang chủ/publications chạy bằng dữ liệu thật, không còn placeholder.

### M4 — Admin console (M)

- [ ] `/admin`: CRUD members (kèm import CSV), CV editor, publications (ẩn/hiện/nổi bật), awards, site settings (hero, research areas), upload ảnh (Supabase Storage).
- [ ] Quản lý user: tạo, reset mật khẩu, vô hiệu hoá, đổi role.
- [ ] Inbox form liên hệ/ứng tuyển (Turnstile + rate limit).
- **Xong khi**: thầy tự cập nhật mọi nội dung public mà không cần sửa code.

### M5 — Tường riêng tư (L)

- [ ] Admin tạo nhóm theo tháng (`period`), gắn/bỏ thành viên, lưu trữ (archive) nhóm cũ.
- [ ] `/app` (dashboard của member: nhóm tháng này, việc được giao), `/app/groups/[id]` = tường: feed post, task, pin announcement.
- [ ] Task: giao cho 1/nhiều người hoặc cả nhóm (không có assignee = cả nhóm), hạn, ưu tiên, trạng thái `todo/doing/review/done`.
- [ ] Comment trên post/task; member cập nhật trạng thái task của mình.
- [ ] Đính kèm file (Storage, bucket private, signed URL, kiểm tra quyền theo nhóm).
- [ ] API `/api/v1/groups|posts|tasks|comments|attachments`, toàn bộ qua session người dùng để RLS có hiệu lực.
- **Xong khi**: kịch bản end-to-end (thầy tạo nhóm → giao việc → member comment/đổi trạng thái → người ngoài nhóm không thấy) chạy được, có test.

### M6 — Polish & bàn giao (M)

- [ ] SEO (metadata, OG image, sitemap, robots; tường `noindex`), a11y pass, tối ưu ảnh.
- [ ] Bảo mật: headers/CSP, rate limit login & form, audit RLS, kiểm tra không lộ service key.
- [ ] Cron ping chống Supabase pause; hướng dẫn backup/export DB.
- [x] ~~i18n~~: không cần, site chỉ tiếng Anh.
- [ ] README vận hành + hướng dẫn cho thầy (tạo user, tạo nhóm, sync ORCID).
- **Xong khi**: checklist bàn giao hoàn tất, thầy dùng thử không cần hỗ trợ.

### M7 — Tuỳ chọn

Thông báo email (Resend), lịch/deadline view, tìm kiếm toàn tường, realtime (Supabase Realtime), export báo cáo tháng.

## Quyết định đã chốt & lý do

- **Postgres (Supabase) thay Firestore**: dữ liệu quan hệ (user–group–tháng–task), RLS đúng bài toán tường riêng tư, free tier có sẵn Auth + Storage.
- **1 app Next.js, API `/api/v1`**: ít thứ phải vận hành; versioned để tách backend sau nếu cần.
- **Không đăng ký công khai, admin tạo user, mật khẩu tạm**: đúng yêu cầu thầy và không phụ thuộc email free tier.
- **CV tuỳ chọn**: `member_cvs.published` quyết định có trang CV hay không.
- **Font đổi hẳn** (Bricolage/Fraunces/Red Hat Mono) vì bộ Unbounded/Space Grotesk/JetBrains Mono của bản cũ trông "AI-generated".
- **Xoá code cũ thay vì sửa**: theo yêu cầu "đập đi xây lại"; còn tham khảo được ở `a7c69da`.

**Cập nhật 06/10/2026 (trang chủ thành blog, ý thầy):** trang chủ = hero giao thức (bỏ dãy số đếm paper) + feed bài viết (bài mới nhất lớn, lọc theo loại ở /news), chưa có bài thì hiện bài báo mới nhất. Thành viên viết bài ở *My posts* (`/app/posts`): Protocol / Paper review / Incident analysis / Article / News, Markdown + ảnh + xem trước, nháp → *Submit for review* → admin duyệt ở `/admin/posts` (Approve hoặc Send back kèm ghi chú, email cho hai bên), bảng đếm bài theo tác giả + CSV để cộng điểm. Byline dẫn tới /people/<slug>. Bảng `news` thêm `status`, `review_note`, `reviewed_by/at`, `submitted_at`, `cover`, `sources`, cột `published` cũ giữ lại nhưng không dùng nữa, để bản preview chạy migration trên DB chung không làm hỏng bản production đang chạy; xoá ở migration sau (migration 0009, bài nháp cũ thành `draft`). `/admin/news` chuyển sang `/admin/posts`. Danh sách thành viên chuyển sang `/team` (nút Team trên menu; `/people` tự chuyển; trang cá nhân vẫn ở `/people/<slug>`). Liên hệ (email thầy, địa chỉ, Apply) nằm ở footer. `/login?next=` quay lại trang đang mở. `--demo` thêm 4 bài mẫu.

# Roadmap & Milestones — Blockchainist Lab Web (rebuild)

> File này là nguồn sự thật để **tiếp tục làm ở session mới** khi session cũ hết token.
> Bắt đầu session mới: đọc `CLAUDE.md` → file này (mục *Trạng thái*) → `docs/ARCHITECTURE.md` → `docs/DESIGN.md`.
> Mỗi khi xong một milestone: tick checklist, cập nhật bảng *Trạng thái*, commit.

## Mục tiêu

Website nhóm nghiên cứu Blockchain (domain `blockchainist.id.vn`) gồm 2 tầng:

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
| Hosting | Vercel (Hobby) + domain `blockchainist.id.vn` | |
| Chống spam form liên hệ | Cloudflare Turnstile | dùng lại ý tưởng từ code cũ |

Lưu ý free tier (kiểm tra lại số liệu hiện hành trước khi dựa vào): Supabase free tự **pause project nếu không hoạt động ~1 tuần** → thêm cron ping (GitHub Actions) ở M6; email mặc định của Supabase bị giới hạn rate rất thấp → **không phụ thuộc email** để tạo account (admin tạo user kèm mật khẩu tạm, bắt đổi khi đăng nhập lần đầu).

## Thông tin cần từ chủ dự án (để bắt đầu)

Đánh dấu ✅ khi đã có.

- [ ] Tạo project **Supabase** (region Singapore) → lấy `URL`, `anon key`, `service_role key`, `DB password`. Khuyến nghị đặt vào **environment secrets** của môi trường Claude Code / Vercel, không dán vào chat hay commit.
- [ ] Tài khoản **Vercel** đã import repo; trỏ DNS `blockchainist.id.vn` (hoặc cho biết nhà đăng ký domain để hướng dẫn).
- [ ] **Email admin** của thầy (dùng làm tài khoản admin đầu tiên) + tên hiển thị, chức danh, ảnh chân dung (đã có `public/tuandung-tran.png`, xác nhận đúng người).
- [ ] **Tên nhóm, logo, tagline, lĩnh vực nghiên cứu** (3–6 mục) — có thể lấy lại từ bản cũ nếu đúng.
- [ ] **Danh sách core members** (thầy cung cấp): tối thiểu `họ tên, vai trò/chức danh, email, ảnh, link (scholar/orcid/github), có CV công khai không`. Định dạng CSV/Google Sheet đều được.
- [ ] **Giải thưởng / thành tích** muốn khoe (hoặc để trống, admin nhập sau).
- [ ] ORCID của thầy: `0000-0003-1156-7072` (lấy từ code cũ — xác nhận). ORCID Public API client id/secret nếu muốn sync ổn định (có thể bắt đầu không cần, dùng public API).
- [x] Ngôn ngữ: **chỉ tiếng Anh** (chốt 30/09/2026).
- [ ] Tường có cần **upload file** không (ảnh/PDF, giới hạn dung lượng)? Mặc định: có, ≤ 10 MB/file.
- [ ] Email gửi thông báo (Resend) — tuỳ chọn, để sau M6.

## Trạng thái

| Milestone | Nội dung | Kích thước | Trạng thái |
|---|---|---|---|
| M0 | Scaffold, tooling, CI (deploy Vercel hoãn theo yêu cầu) | S | ✅ xong (chạy localhost) |
| M1 | Design system + hero 3D + shell public | M | ✅ xong; M1.5 redesign tiếng Anh + nhiều trang + API đọc |
| M2 | DB schema, Auth, admin tạo user | L | ✅ xong (Drizzle + Postgres/PGlite, auth tự viết) |
| M3 | Public content: members/CV, publications (ORCID), awards | L | 🟡 publications thật (30 bài, Crossref); members/CV/awards chưa |
| M4 | Admin console | M | 🟡 tài khoản + nhóm xong; CMS nội dung public chưa |
| M5 | Tường riêng tư theo nhóm/tháng | L | 🟡 wall + bảng việc theo tuần + comment xong; đính kèm file chưa |
| M6 | Polish, SEO, a11y, hardening, bàn giao | M | ⬜ |
| M7 | (tuỳ chọn) thông báo, lịch, tìm kiếm | — | ⬜ |

Chạy thử: `npm install && npm run dev` → http://localhost:3000.

**Cập nhật 01/10/2026 (PR #3):**
- Site tiếng Anh, style portfolio, nhiều trang + API `/api/v1` (xem `docs/DESIGN.md`, `docs/ARCHITECTURE.md`).
- Logo mới: khối lập phương vàng/xanh viền mực (`public/brand/logo-mark.svg`, `logo-lockup.svg`, favicon). Logo PNG cũ (sai chính tả) đã bỏ.
- Publications: 30 bài của thầy lấy từ Crossref theo ORCID + 3 bài IEEE/MAPR thêm tay (`src/data/publications.extra.json`), tự gắn hướng nghiên cứu theo từ khoá. Làm mới: `npm run sync:publications` (cần mạng tới api.crossref.org).
- **Đổi stack DB/Auth**: Drizzle + Postgres (PGlite local), auth tự viết. Lý do trong `docs/ARCHITECTURE.md`.
- Khu thành viên: `/login`, đổi mật khẩu bắt buộc, `/app` (việc của tôi, nhóm của tôi), `/app/groups/[id]` (bảng việc theo tuần: This week/Next week/Later/Done, hạn nộp paper đếm ngược, wall + announcement ghim, comment), `/admin` (tạo tài khoản + mật khẩu tạm, reset, vô hiệu, role; tạo/lưu trữ nhóm, gán thành viên/lead).

**Chạy thử local:** `npm install && ADMIN_PASSWORD=admin-password-123 npm run db:seed -- --demo && npm run dev` → đăng nhập `admin@blockchainist.local` / `admin-password-123` (demo member: `lead@`, `an@`, `binh@blockchainist.local` / `demo-password-123`).

**Còn dở / cần quyết:**
- Deploy: cần một Postgres (khuyên Supabase hoặc Neon free, region Singapore) + Vercel. Đặt `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_NAME` vào environment secrets, không dán vào chat.
- Email thật của thầy để tạo tài khoản admin đầu tiên.
- Roster thành viên (tên, vai trò, ảnh, link) để làm trang People + CV.
- Tên đơn vị (vd. "UIT — VNU-HCM") chưa đưa lên UI vì chưa xác nhận.
- Đính kèm file trên wall cần object storage (Supabase Storage / Vercel Blob).
- Chưa đo Lighthouse / hiệu năng 3D trên GPU thật.

**Bước tiếp theo:** deploy (Postgres + Vercel), trang People/CV từ roster, CMS nội dung public trong /admin, đính kèm file, thông báo deadline qua email (M7).

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

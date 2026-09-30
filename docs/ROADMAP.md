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
- UI cùng style với portfolio `hpgbao2204/hpgbao2204` (sáng, neo-brutalist, **3D blockchain** bằng Three.js). Xem `docs/DESIGN.md`.
- Dữ liệu core members do thầy cung cấp (import từ CSV/JSON, không hard-code).
- Backend phải là **API** (REST `/api/v1`), không chỉ là landing page.
- Code cũ (Next.js + Firebase) đã xoá; còn ở commit `a7c69da` để tham khảo (ORCID client/normalize, Turnstile, Resend, zod validation).

## Stack chốt

| Lớp | Lựa chọn | Ghi chú |
|---|---|---|
| Web + API | Next.js (App Router) + TypeScript, Route Handlers `/api/v1/*` | 1 app duy nhất, dễ vận hành với 2 người |
| Style | Tailwind CSS v4 + design tokens từ portfolio | |
| 3D | `three` (import động, client only) | fallback khi không có WebGL / `prefers-reduced-motion` |
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
- [ ] Ngôn ngữ: chỉ tiếng Việt hay song ngữ Việt/Anh?
- [ ] Tường có cần **upload file** không (ảnh/PDF, giới hạn dung lượng)? Mặc định: có, ≤ 10 MB/file.
- [ ] Email gửi thông báo (Resend) — tuỳ chọn, để sau M6.

## Trạng thái

| Milestone | Nội dung | Kích thước | Trạng thái |
|---|---|---|---|
| M0 | Scaffold, tooling, deploy rỗng | S | ⬜ chưa làm |
| M1 | Design system + hero 3D + shell public | M | ⬜ |
| M2 | DB schema, RLS, Auth, admin tạo user | L | ⬜ |
| M3 | Public content: members/CV, publications (ORCID), awards | L | ⬜ |
| M4 | Admin console | M | ⬜ |
| M5 | Tường riêng tư theo nhóm/tháng | L | ⬜ |
| M6 | Polish, SEO, a11y, hardening, bàn giao | M | ⬜ |
| M7 | (tuỳ chọn) thông báo, lịch, tìm kiếm | — | ⬜ |

Cleanup đã xong: repo đã sạch, chỉ còn `LICENSE`, `public/` (logo, favicon, ảnh PI), tài liệu.
**Bước tiếp theo: M0** (cần ít nhất Supabase + Vercel từ danh sách trên cho M2; M0–M1 làm được ngay không cần).

## Milestones

Quy tắc chung: mỗi milestone = 1–2 session, kết thúc bằng `npm run lint && npm run typecheck && npm run test && npm run build` xanh, commit, cập nhật mục *Trạng thái*.

### M0 — Scaffold (S)

- [ ] `create-next-app` (TS, App Router, Tailwind v4, ESLint), vitest, prettier.
- [ ] `.env.example` (Supabase, Turnstile, `NEXT_PUBLIC_SITE_URL`), `.gitignore` thêm `supabase/.temp`.
- [ ] Copy fonts OFL (Unbounded, Space Grotesk, JetBrains Mono) từ portfolio `scripts/fonts/` vào `public/fonts` hoặc `next/font/local`.
- [ ] CI (GitHub Actions): lint + typecheck + test + build.
- [ ] Deploy rỗng lên Vercel, trỏ domain.
- **Xong khi**: `/` hiển thị trang placeholder trên domain thật, CI xanh.

### M1 — Design system + shell public (M)

- [ ] Tokens (`docs/DESIGN.md`) → Tailwind theme + CSS variables.
- [ ] Component nền: Button, Card, Badge, Nav (sticky + blur), Footer, Section heading, Stat tile.
- [ ] **Hero 3D**: chuỗi block blockchain (Three.js, toon + outline), kéo xoay, lazy-load, fallback.
- [ ] Trang chủ tĩnh với dữ liệu mẫu đánh dấu rõ (hero, hướng nghiên cứu, stats, publications nổi bật, members, CTA).
- [ ] Responsive từ 360px; skip link; focus ring; tôn trọng `prefers-reduced-motion`.
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
- [ ] `GET /api/v1/{members,publications,awards,stats}` công khai, có cache.
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
- [ ] i18n (nếu chọn song ngữ).
- [ ] README vận hành + hướng dẫn cho thầy (tạo user, tạo nhóm, sync ORCID).
- **Xong khi**: checklist bàn giao hoàn tất, thầy dùng thử không cần hỗ trợ.

### M7 — Tuỳ chọn

Thông báo email (Resend), lịch/deadline view, tìm kiếm toàn tường, realtime (Supabase Realtime), export báo cáo tháng.

## Quyết định đã chốt & lý do

- **Postgres (Supabase) thay Firestore**: dữ liệu quan hệ (user–group–tháng–task), RLS đúng bài toán tường riêng tư, free tier có sẵn Auth + Storage.
- **1 app Next.js, API `/api/v1`**: ít thứ phải vận hành; versioned để tách backend sau nếu cần.
- **Không đăng ký công khai, admin tạo user, mật khẩu tạm**: đúng yêu cầu thầy và không phụ thuộc email free tier.
- **CV tuỳ chọn**: `member_cvs.published` quyết định có trang CV hay không.
- **Xoá code cũ thay vì sửa**: theo yêu cầu "đập đi xây lại"; còn tham khảo được ở `a7c69da`.

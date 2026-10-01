# Architecture

## Tổng quan

```
Browser ── Next.js (1 app) ──┬─ Server Components (đọc thẳng qua services)
                             ├─ Route Handlers /api/v1/* (JSON, zod)
                             └─ src/server/services ──► Drizzle ──► Postgres
Crossref (theo ORCID PI) ──► npm run sync:publications ──► src/data/publications.json (M3: vào DB + cron)
```

**Quyết định 01/10/2026 (thay Supabase Auth + RLS):** dùng **Postgres bất kỳ + Drizzle ORM + auth tự viết** (scrypt, session lưu DB).
- Chạy local không cần gì: không có `DATABASE_URL` thì app tự tạo **PGlite** (Postgres nhúng) ở `.data/` và chạy migration. Test dùng PGlite in-memory, nên CI kiểm tra được toàn bộ phân quyền mà không cần server DB.
- Production: đặt `DATABASE_URL` (Supabase Postgres, Neon… đều được, dùng pooled URL) rồi `npm run db:migrate && npm run db:seed`.
- Không phụ thuộc email/Supabase Auth: admin tạo tài khoản, hệ thống sinh mật khẩu tạm, người dùng bắt buộc đổi ở lần đăng nhập đầu.
- Phân quyền nằm ở **một chỗ phía server**: `groupAccess()` trong `src/server/services/groups.ts` và các service gọi nó. Có test cho từng luật (`services.test.ts`).

## Phân quyền

| Vai trò | Quyền |
|---|---|
| visitor | Đọc trang public và API public. Không có đăng ký. |
| member | Xem nhóm mình thuộc về (nhóm khác trả 404, không lộ là có tồn tại); viết note lên wall; comment task; đổi **trạng thái** task giao cho mình hoặc cho cả nhóm. |
| lead (theo nhóm) | Như member + tạo/sửa/xoá task, giao việc, đăng announcement/ghim trong nhóm đó. |
| admin | Toàn quyền: tạo/sửa/vô hiệu tài khoản, reset mật khẩu, đổi role, tạo/lưu trữ nhóm, gán thành viên và lead, xem mọi wall. |

Bảo vệ khác: cookie `httpOnly` + `SameSite=Lax`, chặn request ghi khác origin, rate limit đăng nhập (in-memory), tài khoản còn mật khẩu tạm bị chặn mọi API trừ đổi mật khẩu, vô hiệu/reset xoá session.

## Schema (`src/server/db/schema.ts`, migration trong `drizzle/`)

- `users(id, email unique, name, title, role admin|member, password_hash, must_change_password, active)`
- `sessions(id = sha256(token), user_id, expires_at)`
- `groups(id, name, description, paper_title, target_venue, submission_deadline, period, status active|archived, created_by)`: một nhóm thường là một paper/đợt.
- `group_members(group_id, user_id, role lead|member)`
- `posts(id, group_id, author_id, kind note|announcement, body, pinned)`
- `tasks(id, group_id, created_by, title, description, due_date, priority low|normal|high, status todo|doing|review|done, venue, completed_at)`
- `task_assignees(task_id, user_id)`: rỗng = cả nhóm
- `comments(id, group_id, post_id?, task_id?, author_id, body)`: đúng một trong hai target
- `links(id, group_id, task_id?, kind overleaf|github|drive|paper|other, url, label, added_by)`: không có task = link của cả nhóm (admin/lead); link trên task: người làm task đó
- `meetings(id, title, starts_at, location?, link?, notes?, created_by, reminded_at?)`, `meeting_presenters(meeting_id, user_id, topic?)`, `announcements(id, title, body, author_id, emailed_at?)`: họp lab + thông báo chung, mọi thành viên đăng nhập đều xem; chỉ admin tạo/sửa
- `profiles(user_id, slug, headline, bio, photo_url, portfolio_url, links, interests, cv, display template|portfolio, template, accent, published)`: hồ sơ công khai, chủ tài khoản hoặc admin sửa
- `attachments(id, group_id, task_id?, uploader_id, filename, mime, size, storage_key)`: bytes ở storage (`src/server/storage`), không nằm trong DB

Kế hoạch thêm (M3–M4): `member_profiles`/CV công khai, `publications` trong DB, `awards`, `site_settings`.

Đổi schema: sửa `schema.ts` → `npm run db:generate` → commit SQL mới trong `drizzle/`.

## API `/api/v1` (JSON)

Thành công `{ data, meta? }`, lỗi `{ error: { code, message, details? } }`. Danh sách đầy đủ ở `src/lib/api/catalog.ts` (hiện trên trang `/developers`).

- Public: `stats`, `research`, `research/:slug`, `publications?q&kind&year&area&limit`, `members`, `pioneers`, `health`, `me` (null khi chưa đăng nhập).
- Auth: `POST auth/login`, `POST auth/logout`, `POST auth/change-password`.
- Member: `me/tasks`, `groups`, `groups/:id`, `groups/:id/tasks` (GET/POST, kèm `venue`, `links`), `groups/:id/posts` (GET/POST), `groups/:id/links` (GET/POST), `DELETE links/:id`, `groups/:id/attachments` (GET, POST multipart hoặc JSON `{ key, name, taskId? }` sau upload trực tiếp), `POST groups/:id/attachments/direct` (URL ký để PUT lên bucket; `{ direct: false }` khi lưu ổ đĩa), `GET|DELETE attachments/:id`, `PATCH|DELETE tasks/:id`, `tasks/:id/comments` (GET/POST).
- Admin: `admin/users` (GET/POST), `PATCH admin/users/:id`, `POST admin/users/:id/reset-password`, `admin/groups` (GET/POST), `PATCH admin/groups/:id`, `PUT admin/groups/:id/members`, `admin/reports?month&format=csv`, `admin/digest` (GET xem trước, POST gửi).
- Cron: `GET cron/weekly-digest` (header `Authorization: Bearer $CRON_SECRET`, `?dryRun`).

## Việc nền

- Email thứ Hai: `services/digest.ts` dựng danh sách (quá hạn + trong tuần, giao cho mình hoặc cả nhóm), `server/mail.ts` gửi qua Resend nếu có `RESEND_API_KEY` + `MAIL_FROM`, không thì không gửi gì.
- Báo cáo tháng: `services/reports.ts`; "xong trong tháng" dựa vào `tasks.completed_at` (ghi khi chuyển sang done, xoá khi mở lại).

## Thư mục

```
src/app/                 trang public, /login, /account/password, /app (dashboard, wall), /admin, api/v1
src/components/          site, hero (3D), pubs, app (board, feed, admin), dev
src/lib/content          dữ liệu public (tĩnh, sẽ chuyển sang DB)
src/lib/weeks.ts         tính tuần / bucket deadline (giờ Việt Nam)
src/server/              db (schema, client), auth, services, storage (file), jobs (email thứ Hai), mail, validation
scripts/                 seed.ts, sync-publications.mjs, fetch-pioneers.mjs
drizzle/                 migration SQL
```

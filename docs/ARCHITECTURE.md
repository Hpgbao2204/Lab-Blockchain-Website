# Architecture

## Tổng quan

```
Browser ── Next.js (Vercel) ──┬─ Server Components / Route Handlers  /api/v1/*
                              └─ Supabase: Postgres (RLS) · Auth · Storage
ORCID Public API ──► sync job (admin nút bấm + cron) ──► publications
```

- Public pages render server-side từ DB (chỉ dữ liệu `published`), cache/ISR.
- Mọi endpoint private chạy bằng **session của người dùng** (cookie qua `@supabase/ssr`) để **RLS** áp dụng. `service_role` chỉ dùng ở code server của admin (`/api/v1/admin/*`, script seed), không bao giờ gửi xuống client.

## Phân quyền

| Vai trò | Quyền |
|---|---|
| anon | Đọc nội dung public (members public, CV published, publications published, awards, settings public). Gửi form liên hệ (Turnstile). |
| member | Đọc/ghi profile của mình; đọc tường của nhóm mình thuộc về; tạo comment; đổi trạng thái task được giao (hoặc task của cả nhóm); upload file vào nhóm mình. |
| admin | Toàn quyền: tạo/sửa/vô hiệu user, tạo nhóm, gắn member, tạo post/task, quản lý nội dung public. |

Helper SQL: `is_admin()`, `is_group_member(group_id)` (security definer, dùng trong policy).

## Schema (Postgres) — bản thiết kế

Khoá chính `uuid` (`gen_random_uuid()`), có `created_at`/`updated_at` timestamptz.

**Người dùng & CV**
- `profiles(id → auth.users, role 'admin'|'member', full_name, slug unique, title, avatar_url, bio, contact_email, links jsonb, is_public bool, is_active bool, must_change_password bool)`
- `member_cvs(profile_id pk → profiles, headline, about, education jsonb, experience jsonb, skills text[], projects jsonb, published bool)`

**Nội dung public**
- `publications(id, source 'orcid'|'manual', external_id, doi, title, authors text[], year, venue, type, url, abstract, is_featured, is_published, raw jsonb, unique(source, external_id))`
- `publication_authors(publication_id, profile_id)` — liên kết tự động theo tên chuẩn hoá
- `awards(id, title, year, description, image_url, link, sort_order, is_published)`
- `site_settings(key pk, value jsonb)` — hero, research areas, stats override
- `contact_messages(id, name, email, message, kind 'contact'|'join', status)`

**Tường riêng tư**
- `groups(id, name, period date /* ngày đầu tháng */, description, status 'active'|'archived', created_by)`
- `group_members(group_id, profile_id, role 'lead'|'member', primary key(group_id, profile_id))`
- `posts(id, group_id, author_id, kind 'note'|'announcement', body, pinned)`
- `tasks(id, group_id, created_by, title, description, due_date, priority, status 'todo'|'doing'|'review'|'done')`
- `task_assignees(task_id, profile_id)` — rỗng = cả nhóm
- `comments(id, group_id, post_id null, task_id null, author_id, body)` — check đúng một trong `post_id`/`task_id`
- `attachments(id, group_id, uploader_id, post_id null, task_id null, storage_path, filename, mime, size)`

Storage buckets: `avatars` (public), `public-assets` (public), `wall-files` (**private**, path `group_id/...`, policy theo `is_group_member`).

## API `/api/v1` (REST, JSON, zod-validated)

Public (GET): `/members`, `/members/:slug`, `/publications`, `/awards`, `/stats`, `/settings`. `POST /contact`.

Auth: `POST /auth/login`, `POST /auth/logout`, `POST /auth/change-password`, `GET /me`.

Tường (member+): `GET /groups` (của tôi), `GET /groups/:id`, `GET|POST /groups/:id/posts`, `GET|POST /groups/:id/tasks`, `PATCH /tasks/:id` (member: chỉ `status`), `GET|POST /posts/:id/comments`, `POST /groups/:id/attachments` (signed upload URL).

Admin: `POST|GET|PATCH /admin/users`, `POST /admin/users/:id/reset-password`, CRUD `/admin/{members,cvs,publications,awards,settings}`, `POST /admin/orcid/sync`, `POST /admin/members/import`, `POST|PATCH /admin/groups`, `PUT /admin/groups/:id/members`.

Quy ước lỗi: `{ "error": { "code": "...", "message": "..." } }` với HTTP status đúng nghĩa. Có `openapi.json` sinh từ zod (M6).

## Cấu trúc thư mục dự kiến

```
src/
  app/
    (public)/           # /, /members, /publications, /join, /contact
    (auth)/login
    (app)/app/          # dashboard + tường (cần đăng nhập)
    admin/
    api/v1/...
  components/ui|site|wall|admin|three
  lib/ supabase/ orcid/ validation/ auth/ api/
supabase/migrations/    # SQL + seed
scripts/                # seed admin, import members
docs/
```

## ORCID sync

1. `GET https://pub.orcid.org/v3.0/{orcid}/works` (Accept JSON) → danh sách work summaries.
2. Lấy chi tiết từng `put-code` khi cần (DOI, tác giả, venue).
3. Normalize (title, year, type, doi, url, authors) → upsert theo `(source='orcid', external_id=put-code)`; nếu trùng DOI thì gộp.
4. Giữ nguyên `is_featured`/`is_published` do admin đặt; chỉ cập nhật metadata.
5. Tuỳ chọn: enrich qua Crossref/OpenAlex theo DOI (venue, citation count).

Code tham khảo (đã xoá khỏi nhánh hiện tại): `src/lib/orcid/{client,normalize}.ts` tại commit `a7c69da`.

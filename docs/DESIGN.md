# Design

Hướng thiết kế đã chốt với chủ dự án: **sáng, blockchain, liên chuỗi, có 3D**, tạo cảm giác "web lab có đầu tư". Không bám portfolio cũ; không dùng lại bộ font của source cũ.

## Ý tưởng chính

Hero kể một câu chuyện giao thức: **Alice (Chain A) ↔ Bob (Chain B)** qua một **Relay**. Hai chuỗi khối cuộn liên tục, gói tin đi qua đi lại theo 5 bước HTLC (`lock → proof → verify → claim → ack`), đổi chiều sau mỗi lượt. Nền là chân dung các **tiền nhân** của mật mã/blockchain (duotone, trôi chậm, một người được "bật sáng" luân phiên kèm chú thích). Bảng log kiểu terminal chạy cùng đồng hồ với cảnh 3D (`src/components/hero/protocol.ts`).

## Tokens (xem `src/app/globals.css`)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `bg` | `#eef2f9` | nền trang, clear color của canvas |
| `ink` | `#0b1437` | chữ, nút chính, cạnh khối |
| `chain-a` | `#2b6bff` | Chain A / Alice / nhấn chính (gần màu logo) |
| `chain-b` | `#ff8a1f` | Chain B / Bob |
| `relay` | `#7b4dff` | Relay, bước verify |
| `proof` | `#0fc7a0` | proof / ack |

## Font (cố ý khác bản cũ; Bricolage và Fraunces có subset tiếng Việt)

- **Bricolage Grotesque** (variable, trục `wght` + `wdth`): tiêu đề dùng `font-stretch: 84%` cho nét đặc, thân bài dùng 100%.
- **Fraunces** (variable italic, `SOFT`/`WONK`/`opsz`): chỉ dùng cho từ nhấn trong tiêu đề (`.serif-accent`).
- **Red Hat Mono** (variable): nhãn, log, số liệu. Giữ nội dung mono ở ASCII vì subset Việt của font này không đầy đủ.

Đổi font: sửa 3 dòng `@import` và 3 biến `--font-*` trong `globals.css`.

## Cảnh 3D (`src/components/hero/scene/`)

- React Three Fiber + drei. `flat` (không tone mapping), clear color = `bg`.
- `chain-lane.tsx`: khối kính bo góc + lõi phát sáng + viền ink; 10 khối/chuỗi tái sử dụng (wrap), nhãn `#height` và hash vẽ bằng canvas texture. Chuỗi mờ ở nền (`ghost`).
- `portrait-wall.tsx`: ShaderMaterial duotone (ink ↔ pale, pha màu theo `tint`), cover-crop trong shader, parallax theo con trỏ, spotlight đổi sang màu thật cho một chân dung mỗi ~4s.
- `packet.tsx`: gói tin + vệt hạt + hào quang + vòng xung; `avatar.tsx`, `relay.tsx`, `label.tsx` (sprite canvas, **không dùng drei `Html`** vì gây lỗi "unmount root" trong React 19 dev).
- Hiệu năng/an toàn: import động (`ssr:false`), `frameloop="never"` khi ra khỏi viewport hoặc tab ẩn, dpr ≤ 1.75, `prefers-reduced-motion` → `frozen` (vẽ 1 khung, không Sparkles), không có WebGL → lưới chân dung tĩnh.
- Responsive: `World` tự scale/dời theo aspect (desktop: chuỗi bên phải; màn dọc: cảnh nằm nửa dưới hero). Log ẩn dưới `lg`.

## Ảnh chân dung

`npm run fetch:pioneers` tải ảnh từ Wikimedia Commons, **chỉ giữ CC BY / CC BY-SA / CC0 / public domain**, nén 560px và ghi `src/data/pioneers.generated.json` (tác giả, giấy phép, nguồn). UI luôn hiển thị ghi công dưới mỗi ảnh. Người không có ảnh hợp lệ (Satoshi Nakamoto, danh tính ẩn) dùng hình minh hoạ. Test `src/data/pioneers.test.ts` kiểm tra mọi ảnh đều có ghi công và file tồn tại.

## Khu private (M5)

Cùng tokens nhưng mật độ thông tin cao hơn: 2 cột (feed | thành viên + task), post là card có avatar, task có badge trạng thái (todo=muted, doing=`chain-a`, review=`chain-b`, done=`proof`), announcement ghim nền nhạt. Không đặt hero 3D trong khu private.

## Yêu cầu chung

Responsive từ 360px; skip link; focus ring `chain-a`; không phụ thuộc hover; nội dung `.reveal` chỉ bị ẩn khi có JS (`@media (scripting: enabled)`).

# Design

Hướng thiết kế chốt với chủ dự án (30/09/2026): **toàn bộ tiếng Anh**, **style giống portfolio** `hpgbao2204/hpgbao2204` (`site/style.css`), **sáng, có 3D**, và là **app nhiều trang có API**, không phải landing page cuộn dài.

## Ngôn ngữ thiết kế (lấy từ portfolio)

- Nền giấy ấm `paper #f6f3ec` + lưới sổ cái mờ 44px; card `#fffdf8`.
- Viền mực 2px `ink #16140f`, **bóng cứng lệch** (`4px 4px 0 ink`, `7px 7px 0` cho card lớn), bo 12–18px.
- Accent sáng: yellow `#ffc730` (chính), blue `#3d8bff`, orange `#ff8f42`, red `#ff4b4b`, pink `#ff4fa3`, violet `#a26bff`, teal `#00c9b0`, lime `#b6ec2c`. Mỗi component nhận màu qua biến `--c`.
- Tiêu đề lớn: một phần chữ vàng viền mực (`.hl`, `.line-2`), eyebrow mono + chấm lime nhấp nháy, số thứ tự section trong viên thuốc (`.section-no`).
- Nút `.btn` (hover nhấc lên, bóng dày thêm), chip lọc `.chip[aria-pressed]`, tag `.tag`, card công bố viền trên màu theo loại (journal=yellow, conference=blue, article=pink), tác giả PI gạch chân lượn sóng xanh.

## Font

Unbounded (display 600/800), Space Grotesk (thân 400/500/700), JetBrains Mono (nhãn/log 400/700), tự host qua `@fontsource`. Đổi font: sửa các `@import` và 3 biến `--font-*` trong `src/app/globals.css`, và 3 chỗ vẽ canvas trong `src/components/hero/scene/{block-texture,label,portrait-wall}`.

Class component nằm trong `@layer components` để utility của Tailwind vẫn ghi đè được.

## Trang

| Route | Nội dung |
|---|---|
| `/` | Hero (chữ trái, cửa sổ 3D phải) + dải "pioneer spotlight" + ô Explore dẫn sang các trang + 2 bài mới nhất |
| `/research`, `/research/[slug]` | Hướng nghiên cứu, trang chi tiết có câu hỏi mở, từ khoá, bài liên quan |
| `/publications` | Tìm kiếm + lọc (loại/năm/hướng) gọi `GET /api/v1/publications` phía client; trang đầu render sẵn |
| `/people` | PI + chỗ cho roster (M3) |
| `/pioneers` | Lưới chân dung duotone có ghi công |
| `/join` | Lý do, các bước ứng tuyển, liên hệ PI |
| `/developers` | Danh sách endpoint + "try it" gọi API thật |
| `/login` | Giữ chỗ (M2) |

## Hero 3D (`src/components/hero/`)

Cảnh R3F cũ (Alice/Chain A ↔ Relay ↔ Bob/Chain B, 5 bước HTLC, tường chân dung) giữ nguyên logic, chỉ đổi palette sang portfolio và đặt trong một **cửa sổ** kiểu terminal (`.window`): thanh 3 chấm, khung canvas 5:4 (4:3.4 trên điện thoại), log terminal nền mực bên dưới. Chú thích tiền nhân đang được "bật sáng" chạy ở dải quote bên dưới hero. Tiêu đề BLOCK/CHAINIST co theo bề rộng cột (`cqi`) để không tràn vào cảnh.

Hiệu năng/an toàn giữ như cũ: import động, dừng render khi ra khỏi viewport/tab ẩn, dpr ≤ 1.75, `prefers-reduced-motion` → đứng hình, không WebGL → lưới ảnh tĩnh. Chưa đo trên GPU thật.

## Ảnh chân dung

`npm run fetch:pioneers` chỉ giữ ảnh CC BY / CC BY-SA / CC0 / public domain; UI luôn ghi tác giả + giấy phép. Satoshi dùng hình bóng có dấu "?".

## Khu private (M5)

Cùng tokens, mật độ cao hơn; không đặt hero 3D. Badge trạng thái task: todo=paper-2, doing=blue, review=orange, done=teal.

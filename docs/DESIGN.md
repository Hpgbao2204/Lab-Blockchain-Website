# Design — lấy từ portfolio `hpgbao2204/hpgbao2204`

Nguồn tham chiếu: `site/style.css` (tokens, components), `site/main.js` (hero 3D, motion), `scripts/fonts/` (font OFL). Lab web dùng **cùng ngôn ngữ thiết kế**, đổi nội dung/branding cho nhóm.

## Cảm giác

Sáng, giấy kem + mực đen, viền đậm, bóng cứng (neo-brutalist), màu nhấn rực kiểu "block" blockchain, có chuỗi khối 3D ở hero. Chuyên nghiệp nhưng có cá tính; không dùng gradient tím mờ generic.

## Tokens

```css
--paper:#f6f3ec; --paper-2:#efebe1; --card:#fffdf8;
--ink:#16140f; --ink-2:#3a362e; --muted:#6d675c; --line:#d9d2c3;
--yellow:#ffc730; --orange:#ff8f42; --red:#ff4b4b; --pink:#ff4fa3;
--violet:#a26bff; --blue:#3d8bff; --teal:#00c9b0; --lime:#b6ec2c;
--shadow:4px 4px 0 var(--ink); --shadow-lg:7px 7px 0 var(--ink);
--radius:14px; --gutter:clamp(16px,4vw,48px); --max:1180px;
--display:"Unbounded","Space Grotesk",system-ui,sans-serif;
--sans:"Space Grotesk",system-ui,sans-serif;
--mono:"JetBrains Mono",ui-monospace,monospace;
```

- Nền body: `--paper` + lưới "ledger" mờ 44px (`--paper-2`).
- `::selection` vàng; `:focus-visible` outline 3px `--blue`.
- Nav sticky, nền paper 86% + `backdrop-filter: blur(10px)`, viền dưới 2px ink; link dạng pill, hover/active có viền ink + nền card.
- Card/button: viền 2px ink, `--shadow`, hover dịch chuyển nhẹ (nhấn = bỏ bóng).
- Brand mark: ô vuông vàng bo 8px, viền ink, bóng 2px.
- Mono cho nhãn/số liệu/hash; display (Unbounded) cho tiêu đề lớn.

## Hero 3D (Three.js)

Tham khảo `site/main.js` ~ dòng 148+:

- Các **block** (BoxGeometry) xếp trên vòng tròn, lắc nhẹ theo sin, **nối bằng cylinder** mảnh → chuỗi blockchain; một "core" ở giữa.
- Vật liệu **MeshToonMaterial** màu lấy từ palette; **outline** bằng mesh back-face màu ink + `EdgesGeometry` cạnh ink.
- Ánh sáng: HemisphereLight (trắng / kem) + DirectionalLight; nền trong suốt để thấy giấy.
- Tương tác: kéo để xoay (orbit tự viết), tự xoay chậm; `touch-action: pan-y` để không chặn scroll mobile.
- Hiệu năng: `import("three")` động, chỉ khởi tạo khi canvas vào viewport, giới hạn devicePixelRatio, dừng render khi tab ẩn.
- Degrade: không WebGL / lỗi import / `prefers-reduced-motion` → canvas trống hoặc ảnh tĩnh, trang vẫn đầy đủ.

Trên Lab web: dùng block gắn nhãn theo hướng nghiên cứu (Blockchain, Security, Network, ZK, Cross-chain…) để hero mang ý nghĩa, không chỉ trang trí. Có thể lặp lại motif chuỗi block làm divider/loader ở các trang.

## Motion

Portfolio dùng anime.js. Bản Lab: ưu tiên CSS + `framer-motion` hoặc anime.js nhẹ; chỉ animate `transform/opacity`; reveal-on-scroll; tắt khi reduced-motion.

## Tường riêng tư

Cùng tokens nhưng mật độ thông tin cao hơn: layout 2 cột (feed | sidebar thành viên + task), post là card có avatar, task là thẻ có badge trạng thái (màu: todo=muted, doing=blue, review=orange, done=teal), announcement ghim nền vàng. Không đặt hero 3D trong khu private.

## Yêu cầu chung

Responsive từ 360px; tương phản đủ (chữ ink trên paper/card); skip link; focus rõ; không phụ thuộc hover; font tự host (woff2) `font-display: swap`.

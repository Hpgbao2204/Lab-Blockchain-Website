/** `Nguyễn Văn Đức` → `Nguyen Van Duc`: Vietnamese without accents, spaces tidied. */
export function withoutAccents(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim();
}

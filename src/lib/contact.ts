/** `+84 901 234 567` or `0901.234.567` → `https://zalo.me/0901234567`, which opens a Zalo chat. */
export function zaloLink(phone: string) {
  const digits = phone.replace(/[^0-9+]/g, "").replace(/^\+84/, "0");
  return `https://zalo.me/${digits.replace(/\+/g, "")}`;
}

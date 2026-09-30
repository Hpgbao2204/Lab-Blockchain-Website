import type { Locale } from "@/lib/i18n";

export type ProfileCopy = {
  name: string;
  researchRole: string;
  publicLink: string;
  publicLinkHelp: string;
  avatarUrl: string;
  avatarUrlHelp: string;
  bio: string;
  personalWebsite: string;
  researchInterests: string;
  education: string;
  achievements: string;
  selectedPublications: string;
  selectedProjects: string;
  cvUrl: string;
  cvUrlHelp: string;
  showPublic: string;
  showPublicHelp: string;
  saving: string;
  save: string;
  selectionHint: string;
  noRecords: string;
  addRecord: string;
  unavailableRecord: string;
  moveUp: string;
  moveDown: string;
  remove: string;
};

const vietnamese: ProfileCopy = {
  name: "Tên",
  researchRole: "Vai trò nghiên cứu",
  publicLink: "Liên kết hồ sơ công khai",
  publicLinkHelp: "Hồ sơ chỉ hiển thị công khai khi bạn bật tùy chọn bên dưới.",
  avatarUrl: "Liên kết ảnh đại diện",
  avatarUrlHelp: "Website không nhận upload ảnh. Hãy đăng ảnh ở dịch vụ khác, mở quyền xem theo link, rồi dán URL HTTP(S).",
  bio: "Giới thiệu ngắn",
  personalWebsite: "Website cá nhân",
  researchInterests: "Hướng nghiên cứu (mỗi dòng một mục)",
  education: "Học vấn (mỗi dòng một mục)",
  achievements: "Thành tích (mỗi dòng một mục)",
  selectedPublications: "Công bố đã chọn",
  selectedProjects: "Dự án đã chọn",
  cvUrl: "Liên kết CV",
  cvUrlHelp: "Website không lưu CV. Hãy upload CV lên Google Drive, Docs hoặc Notion rồi dán link có thể mở.",
  showPublic: "Hiển thị hồ sơ công khai",
  showPublicHelp: "Tắt tùy chọn này để ẩn hồ sơ và thẻ thành viên khỏi các trang công khai.",
  saving: "Đang lưu...",
  save: "Lưu hồ sơ",
  selectionHint: "Thêm bản ghi công khai, rồi dùng mũi tên để sắp xếp thứ tự hiển thị.",
  noRecords: "Chưa chọn bản ghi nào.",
  addRecord: "Thêm bản ghi",
  unavailableRecord: "Bản ghi không còn khả dụng",
  moveUp: "Đưa {title} lên",
  moveDown: "Đưa {title} xuống",
  remove: "Xóa {title}"
};

const english: ProfileCopy = {
  name: "Name",
  researchRole: "Research role",
  publicLink: "Public profile link",
  publicLinkHelp: "Your profile is visible only when the option below is enabled.",
  avatarUrl: "Avatar image link",
  avatarUrlHelp: "This website does not upload images. Host the image elsewhere with link access, then paste its HTTP(S) URL.",
  bio: "Short bio",
  personalWebsite: "Personal website",
  researchInterests: "Research interests (one per line)",
  education: "Education (one per line)",
  achievements: "Achievements (one per line)",
  selectedPublications: "Selected publications",
  selectedProjects: "Selected projects",
  cvUrl: "CV link",
  cvUrlHelp: "This website does not store CV files. Upload one to Google Drive, Docs, or Notion and paste an accessible link.",
  showPublic: "Show this profile publicly",
  showPublicHelp: "Turn this off to hide your profile and contributor card from public pages.",
  saving: "Saving...",
  save: "Save profile",
  selectionHint: "Add public records, then use arrows to set the public portfolio order.",
  noRecords: "No records selected.",
  addRecord: "Add a record",
  unavailableRecord: "Unavailable record",
  moveUp: "Move {title} up",
  moveDown: "Move {title} down",
  remove: "Remove {title}"
};

export function getProfileCopy(locale: Locale): ProfileCopy {
  return locale === "vi" ? vietnamese : english;
}

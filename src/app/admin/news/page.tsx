import { redirect } from "next/navigation";

/** News is now part of Posts. */
export default function NewsAdminPage() {
  redirect("/admin/posts");
}

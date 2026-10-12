import { redirect } from "next/navigation";

/** Moved: tutorials are written from the Tutorials page. */
export default function OldNewTutorial() {
  redirect("/tutorials/new");
}

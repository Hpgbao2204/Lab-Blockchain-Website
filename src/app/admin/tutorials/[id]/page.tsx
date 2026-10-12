import { redirect } from "next/navigation";

/** Moved: tutorials are edited from the Tutorials page. */
export default async function OldEditTutorial({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/tutorials/edit/${(await params).id}`);
}

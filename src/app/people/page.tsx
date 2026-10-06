import { permanentRedirect } from "next/navigation";

/** The team list moved to /team; member pages stay at /people/<name>. */
export default function PeoplePage() {
  permanentRedirect("/team");
}

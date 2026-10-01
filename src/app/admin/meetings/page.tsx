import type { Metadata } from "next";
import { AdminMeetingItem, DeleteAnnouncement, NewAnnouncement, NewMeeting } from "@/components/app/admin-meetings";
import { MeetingCard } from "@/components/app/meeting-card";
import { PageHead, SectionHead } from "@/components/site/page-head";
import { getDb } from "@/server/db";
import { requirePageUser } from "@/server/auth/current";
import { mailConfigured } from "@/server/mail";
import { listAnnouncements, listMeetings, meetingParts, presenterRotation } from "@/server/services/meetings";
import { addDays, formatDay, formatStamp, labToday } from "@/lib/weeks";

export const metadata: Metadata = { title: "Meetings & announcements" };

export default async function MeetingsAdminPage() {
  const user = await requirePageUser({ admin: true });
  const db = await getDb();
  const [upcoming, past, rotation, notices] = await Promise.all([
    listMeetings(db, user, { when: "upcoming" }),
    listMeetings(db, user, { when: "past", limit: 6 }),
    presenterRotation(db, user),
    listAnnouncements(db, user, 10),
  ]);
  const people = rotation.map((p) => ({ id: p.id, name: p.name, times: p.times, lastPresented: p.lastPresented ? formatDay(p.lastPresented.toISOString().slice(0, 10)) : null }));
  const configured = mailConfigured();

  return (
    <div className="wrap page grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHead eyebrow="Admin · lab" title={<>Meetings &amp; <span className="hl">announcements</span></>}>
        Schedule lab meetings and pick who presents. Every member sees them on their dashboard and gets an email at the address they sign in with, plus a
        reminder at 07:00 on the day.
      </PageHead>

      {!configured && (
        <p className="note">
          <b>Email</b>
          <span>
            Not set up on this server, so emails are written to <code>.data/outbox</code> for preview instead of being sent. On the live site add{" "}
            <code>RESEND_API_KEY</code> and <code>MAIL_FROM</code>.
          </span>
        </p>
      )}

      <section aria-labelledby="upcoming" className="grid gap-4">
        <SectionHead id="upcoming" no={String(upcoming.length).padStart(2, "0")} title="Upcoming meetings" />
        <NewMeeting people={people} defaultDate={addDays(labToday(), 7)} />
        <div className="grid gap-4 lg:grid-cols-2">
          {upcoming.map((m) => (
            <AdminMeetingItem key={m.id} meeting={{ ...m, ...meetingParts(m.startsAt) }} people={people} />
          ))}
        </div>
        {!upcoming.length && <p className="note"><b>None</b><span>No meeting scheduled yet.</span></p>}
      </section>

      <section aria-labelledby="announce" className="grid gap-4">
        <SectionHead id="announce" no={String(notices.length).padStart(2, "0")} title="Announcements to everyone" />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <NewAnnouncement />
          <ul className="grid gap-3">
            {notices.map((a) => (
              <li key={a.id} className="card grid gap-1.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold">{a.title}</h3>
                  <DeleteAnnouncement id={a.id} />
                </div>
                <p className="whitespace-pre-line text-sm text-ink-2">{a.body}</p>
                <p className="mono text-xs text-muted">
                  {formatStamp(a.createdAt)}
                  {a.emailedAt ? " · emailed" : " · not emailed"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past" className="grid gap-4">
          <SectionHead id="past" no={String(past.length).padStart(2, "0")} title="Recent meetings" />
          <div className="grid gap-4 opacity-80 lg:grid-cols-2">
            {past.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

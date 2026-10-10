import { relations, sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["admin", "member"]);
export const groupRoleEnum = pgEnum("group_role", ["lead", "member"]);
export const groupStatusEnum = pgEnum("group_status", ["active", "archived"]);
export const postKindEnum = pgEnum("post_kind", ["note", "announcement"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "doing", "review", "done"]);
export const priorityEnum = pgEnum("task_priority", ["low", "normal", "high"]);
export const profileDisplayEnum = pgEnum("profile_display", ["template", "portfolio", "redirect"]);
export const linkKindEnum = pgEnum("link_kind", ["overleaf", "github", "drive", "paper", "other"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Accounts are only ever created by an admin; there is no sign-up. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  title: text("title"),
  role: roleEnum("role").notNull().default("member"),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

/** Fixed-window counters (login attempts). In the database so every server instance shares them. */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

/** Server-side sessions; the cookie holds a random token, the table only its SHA-256. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** A research team, usually working towards one paper (e.g. per month or per submission). */
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  paperTitle: text("paper_title"),
  targetVenue: text("target_venue"),
  submissionDeadline: date("submission_deadline"),
  period: date("period"),
  status: groupStatusEnum("status").notNull().default("active"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: groupRoleEnum("role").notNull().default("member"),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] }), index("group_members_user_idx").on(t.userId)],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: postKindEnum("kind").notNull().default("note"),
    body: text("body").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("posts_group_idx").on(t.groupId, t.createdAt)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: date("due_date").notNull(),
    priority: priorityEnum("priority").notNull().default("normal"),
    status: taskStatusEnum("status").notNull().default("todo"),
    /** journal or conference this piece of work is aimed at */
    venue: text("venue"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    /** who last changed the task, so a change by someone else shows up as new on the wall */
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [index("tasks_group_due_idx").on(t.groupId, t.dueDate)],
);

/** No rows for a task means it is assigned to the whole group. */
export const taskAssignees = pgTable(
  "task_assignees",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.userId] }), index("task_assignees_user_idx").on(t.userId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [
    check("comments_one_target", sql`(${t.postId} is null) <> (${t.taskId} is null)`),
    index("comments_task_idx").on(t.taskId),
    index("comments_post_idx").on(t.postId),
  ],
);

/** Overleaf, GitHub, Drive… links pinned to a group or to one task. */
export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    kind: linkKindEnum("kind").notNull().default("other"),
    url: text("url").notNull(),
    label: text("label"),
    addedBy: uuid("added_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("links_group_idx").on(t.groupId), index("links_task_idx").on(t.taskId)],
);

/** Uploaded files (PDF, images) on a group or a task. Bytes live in object storage under `storageKey`. */
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }),
    uploaderId: uuid("uploader_id").references(() => users.id, { onDelete: "set null" }),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    storageKey: text("storage_key").notNull().unique(),
    ...timestamps,
  },
  (t) => [index("attachments_group_idx").on(t.groupId), index("attachments_task_idx").on(t.taskId)],
);

/**
 * When someone last looked at a wall: `scope` is a group id, or "lab" for lab meetings and
 * announcements. Anything others did after that counts as new (the red dot on "My wall").
 */
export const wallReads = pgTable(
  "wall_reads",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.scope] })],
);

export const groupRelations = relations(groups, ({ many }) => ({ members: many(groupMembers), tasks: many(tasks), posts: many(posts) }));
export const groupMemberRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));
export const taskRelations = relations(tasks, ({ many, one }) => ({
  assignees: many(taskAssignees),
  comments: many(comments),
  group: one(groups, { fields: [tasks.groupId], references: [groups.id] }),
}));
export const taskAssigneeRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, { fields: [taskAssignees.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskAssignees.userId], references: [users.id] }),
}));
export const postRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}));
export const commentRelations = relations(comments, ({ one }) => ({
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
}));

export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Link = typeof links.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];

/** Lab meetings (seminar / weekly meeting): when, where, and who presents. Visible to every member. */
export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    location: text("location"),
    link: text("link"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    /** set once the reminder email for the day of the meeting has gone out */
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("meetings_starts_idx").on(t.startsAt)],
);

export const meetingPresenters = pgTable(
  "meeting_presenters",
  {
    meetingId: uuid("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** what this person presents, e.g. a paper title */
    topic: text("topic"),
  },
  (t) => [primaryKey({ columns: [t.meetingId, t.userId] }), index("meeting_presenters_user_idx").on(t.userId)],
);

/** Lab-wide notices from the admin, shown on every member's dashboard and optionally emailed. */
export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    emailedAt: timestamp("emailed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("announcements_created_idx").on(t.createdAt)],
);

export interface CvEntry {
  title: string;
  org?: string | null;
  period?: string | null;
  url?: string | null;
  detail?: string | null;
}
export interface CvSections {
  education: CvEntry[];
  experience: CvEntry[];
  projects: CvEntry[];
  awards: CvEntry[];
}

/**
 * A member's public profile on /people. Each member edits their own: either a CV built from the
 * site's templates, or a portfolio they designed themselves. Hidden until published.
 */
export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  headline: text("headline"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  portfolioUrl: text("portfolio_url"),
  links: jsonb("links").$type<{ label: string; url: string }[]>().notNull().default([]),
  interests: jsonb("interests").$type<string[]>().notNull().default([]),
  cv: jsonb("cv").$type<CvSections>().notNull().default({ education: [], experience: [], projects: [], awards: [] }),
  /**
   * `template`: the site renders the CV. `portfolio`: /people/[slug] shows `portfolioUrl` inside the
   * lab's frame (or redirects when that site refuses to be framed). `redirect`: always redirects.
   */
  display: profileDisplayEnum("display").notNull().default("template"),
  template: text("template").notNull().default("classic"),
  accent: text("accent").notNull().default("yellow"),
  published: boolean("published").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsKindEnum = pgEnum("news_kind", ["news", "award", "paper", "event", "protocol", "paper_review", "incident", "article", "tutorial"]);
export const newsStatusEnum = pgEnum("news_status", ["draft", "submitted", "published", "rejected"]);
export const applicationStatusEnum = pgEnum("application_status", ["new", "contacted", "accepted", "declined"]);

/**
 * Posts on the public blog (/news and the home page): lab news written by the admin, and articles
 * members write (protocol explainers, paper reviews, incident analyses). A member's post goes
 * draft → submitted → published (or rejected with a note, then edited and submitted again).
 * Kind `tutorial` is written by admins only and shown on /tutorials instead of the blog.
 */
export const news = pgTable(
  "news",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    kind: newsKindEnum("kind").notNull().default("news"),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    /** Markdown */
    body: text("body"),
    link: text("link"),
    /** cover image URL, usually an image uploaded through /api/v1/images */
    cover: text("cover"),
    /** where collected material comes from (Markdown); required for summaries of others' work */
    sources: text("sources"),
    /** the date shown on the item (Vietnam calendar day); set to the approval day for members' posts */
    publishedOn: date("published_on").notNull(),
    /**
     * Superseded by `status`; kept (and unused) so a preview build that migrates the shared
     * database cannot break the code still running in production. Drop in a later migration.
     */
    published: boolean("published").notNull().default(true),
    status: newsStatusEnum("status").notNull().default("published"),
    /** the admin's note when sending a post back (or approving with a comment) */
    reviewNote: text("review_note"),
    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    /** drafted by the daily desk bot (AI, removed in Oct 2026); its published posts stay up with this label */
    aiAssisted: boolean("ai_assisted").notNull().default(false),
    /** the bot's own fact check (Markdown), for the reviewer; no longer written */
    aiCheck: text("ai_check"),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("news_published_idx").on(t.publishedOn), index("news_status_idx").on(t.status), index("news_author_idx").on(t.authorId)],
);
export type NewsItem = typeof news.$inferSelect;

/** Applications sent from the public Join form; only admins read them. */
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    program: text("program").notNull(),
    studentId: text("student_id"),
    interests: jsonb("interests").$type<string[]>().notNull().default([]),
    message: text("message").notNull(),
    link: text("link"),
    facebook: text("facebook"),
    /** phone number the applicant uses on Zalo */
    zalo: text("zalo"),
    status: applicationStatusEnum("status").notNull().default("new"),
    adminNote: text("admin_note"),
    /** everyone on the application (the first is the contact, copied to name/email/… above) */
    members: jsonb("members").$type<Applicant[]>().notNull().default([]),
    /** messages the admins sent to the applicant from the site, oldest first */
    replies: jsonb("replies").$type<ApplicationReply[]>().notNull().default([]),
    ...timestamps,
  },
  (t) => [index("applications_created_idx").on(t.createdAt)],
);
export type Application = typeof applications.$inferSelect;
export interface Applicant {
  name: string;
  studentId: string;
  email: string;
  phone: string;
  zalo: string;
  facebook: string;
  /** the account made for this person when the application was accepted */
  userId?: string | null;
  account?: "created" | "existing";
}
export interface ApplicationReply {
  at: string;
  by: string;
  status: "new" | "contacted" | "accepted" | "declined";
  message: string;
  /** whether the email reached the mail provider */
  emailed: boolean;
}

/** Publications the admin adds by hand, on top of the Crossref snapshot in `src/data`. */
export const publicationEntries = pgTable("publication_entries", {
  id: text("id").primaryKey(),
  name: text("name"),
  title: text("title").notNull(),
  year: integer("year").notNull(),
  kind: text("kind").notNull(),
  authors: jsonb("authors").$type<string[]>().notNull().default([]),
  venue: text("venue"),
  doi: text("doi"),
  url: text("url"),
  areas: jsonb("areas").$type<string[]>().notNull().default([]),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

/** Snapshot publications the admin hid from the public list (ids from `src/data/publications`). */
export const hiddenPublications = pgTable("hidden_publications", {
  id: text("id").primaryKey(),
  ...timestamps,
});

/**
 * Items the daily desk bot read from RSS feeds. The bot was removed in Oct 2026; this table and
 * `desk_runs` are no longer written and stay only because preview builds migrate the shared
 * database. Drop both in a later migration.
 */
export const feedItems = pgTable(
  "feed_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** key of the feed the item came from */
    source: text("source").notNull(),
    url: text("url").notNull().unique(),
    title: text("title").notNull(),
    /** the summary or text the feed itself publishes, HTML stripped, at most a few thousand characters */
    summary: text("summary").notNull().default(""),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    /** the post written from this item, if any */
    postId: uuid("post_id").references(() => news.id, { onDelete: "set null" }),
  },
  (t) => [index("feed_items_fetched_idx").on(t.fetchedAt), index("feed_items_source_idx").on(t.source)],
);
export type FeedItem = typeof feedItems.$inferSelect;

/** One run of the removed daily desk bot; unused, see `feedItems`. */
export const deskRuns = pgTable(
  "desk_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Vietnam calendar day of the run */
    day: date("day").notNull(),
    trigger: text("trigger").notNull().default("cron"),
    /** "news" or "protocol" when a post was written */
    kind: text("kind"),
    /** key of the protocol topic the post explained */
    topic: text("topic"),
    postId: uuid("post_id").references(() => news.id, { onDelete: "set null" }),
    /** per-feed results, new item counts, and errors */
    report: jsonb("report").notNull().default({}),
    error: text("error"),
    ...timestamps,
  },
  (t) => [index("desk_runs_day_idx").on(t.day)],
);
export type DeskRun = typeof deskRuns.$inferSelect;

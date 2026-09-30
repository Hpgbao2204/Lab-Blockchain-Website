import { relations, sql } from "drizzle-orm";
import { boolean, check, date, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["admin", "member"]);
export const groupRoleEnum = pgEnum("group_role", ["lead", "member"]);
export const groupStatusEnum = pgEnum("group_status", ["active", "archived"]);
export const postKindEnum = pgEnum("post_kind", ["note", "announcement"]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "doing", "review", "done"]);
export const priorityEnum = pgEnum("task_priority", ["low", "normal", "high"]);
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

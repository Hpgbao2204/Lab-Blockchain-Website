export type ImageAsset = {
  url?: string;
  cloudinaryId?: string;
  alt: string;
};

export type Member = {
  id: string;
  name: string;
  slug: string;
  role: string;
  avatar?: ImageAsset;
  bio?: string;
  links: {
    googleScholar?: string;
    orcid?: string;
    webOfScience?: string;
    scopus?: string;
    website?: string;
    github?: string;
  };
  aliases: string[];
  researchInterests: string[];
  education: string[];
  achievements: string[];
  // Kept only to deserialize historical records. New profiles use cvUrl.
  cvAttachmentIds?: string[];
  cvUrl?: string;
  publicationIds: string[];
  projectIds: string[];
  order: number;
  isActive: boolean;
  isPublic: boolean;
  hasPublicProfile: boolean;
  publicationCount?: number;
};

export type Publication = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  type?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  source?: string;
  orcidPutCodes: number[];
  externalIds: Record<string, string>;
  image?: ImageAsset;
  isFeatured: boolean;
  isPublished: boolean;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status?: "ongoing" | "completed" | "open";
  leader: string;
  members: string[];
  memberIds: string[];
  tags: string[];
  funding?: string;
  level?: string;
  type?: string;
  startYear?: number;
  endYear?: number;
  budget?: number;
  fundingAgency?: string;
  abstract?: string;
  objectives?: string;
  results?: string;
  url?: string;
  doi?: string;
  image?: ImageAsset;
  isFeatured: boolean;
};

export type ApplicationStatus = "pending" | "contacted" | "archived";

export type UserRole = "owner" | "admin" | "member";

export type UserStatus = "active" | "inactive" | "pending";

export type User = {
  uid: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  memberId?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  memberIds: string[];
  // Legacy-only input compatibility. New records never write this field.
  mentorIds?: string[];
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
};

export type TaskStatus = "in_progress" | "blocked" | "completed";

export type Task = {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  targetDate?: string;
  assigneeMemberIds: string[];
  likedByUids: string[];
  submittedAt?: unknown;
  submittedBy?: string;
  reviewedAt?: unknown;
  reviewedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
};

export type ResourceLink = {
  title: string;
  url: string;
  note?: string;
};

export type TeamResource = ResourceLink & {
  id: string;
  teamId: string;
  taskId?: string;
  progressId?: string;
  authorUid: string;
  authorMemberId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CommentTargetType = "task" | "progress" | "resource";

export type TeamComment = {
  id: string;
  teamId: string;
  targetType: CommentTargetType;
  targetId: string;
  body: string;
  authorUid: string;
  authorMemberId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ApplicationInput = {
  name: string;
  email: string;
  school?: string;
  phone?: string;
  message: string;
  status: ApplicationStatus;
  source: "website_contact_form";
};

export type ProgressUpdateStatus = "not_started" | "in_progress" | "blocked" | "completed";

export type ProgressUpdate = {
  id: string;
  memberId: string;
  title: string;
  status: ProgressUpdateStatus;
  goals?: string;
  note?: string;
  targetDate?: string;
  teamId?: string;
  taskId?: string;
  links: string[];
  imageUrls: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedBy?: string;
};

export type SiteSettings = {
  siteName: string;
  tagline: string;
  contactEmail: string;
  orcidId: string;
  googleScholarUrl?: string;
  featureFlags: {
    orcidSyncEnabled: boolean;
  };
  principalInvestigator: {
    name: string;
    title: string;
    bio: string;
    avatarUrl?: string;
    researchInterests: string[];
  };
  orcidSync: {
    status: "idle" | "running" | "succeeded" | "failed";
    lastSyncAt?: string;
    lastSuccessfulAt?: string;
    lastError?: string;
  };
};

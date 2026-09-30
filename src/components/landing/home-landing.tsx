"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  ExternalLink,
  FileText,
  FlaskConical,
  GitBranch,
  Link2,
  Network,
  Quote,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Member, Publication, SiteSettings } from "@/types/content";
import { useTranslation } from "@/components/i18n/locale-provider";

const keywords = [
  "Blockchain",
  "Smart Contracts",
  "Network Security",
  "IoT/Edge",
  "AI Security",
  "Digital Twins",
];

const researchAreas = [
  {
    titleKey: "homeAreaBlockchainTitle",
    descriptionKey: "homeAreaBlockchainDescription",
    bullets: [
      "High-throughput consensus protocol modeling & sharding state sync.",
      "Formal verification frameworks for EVM, WASM, and Move smart contracts.",
      "Automated vulnerability detection and game-theoretic audits in DeFi protocols.",
    ],
    tags: ["Consensus", "DeFi", "Formal methods"],
    icon: Link2,
  },
  {
    titleKey: "homeAreaNetworkTitle",
    descriptionKey: "homeAreaNetworkDescription",
    bullets: [
      "Machine learning models for real-time network intrusion detection (IDS).",
      "Cryptographic protocols and policies for zero-trust enterprise networks.",
      "Lightweight cryptographic implementations for resource-constrained nodes.",
    ],
    tags: ["IDS", "Privacy", "Zero trust"],
    icon: ShieldCheck,
  },
  {
    titleKey: "homeAreaIotTitle",
    descriptionKey: "homeAreaIotDescription",
    bullets: [
      "Decentralized Identity (DID) architectures for secure IoT device onboarding.",
      "Trust negotiation and secure routing in edge computing environments.",
      "Verifiable digital twin synchronization using distributed ledgers.",
    ],
    tags: ["Edge", "IoT", "Trust"],
    icon: Network,
  },
  {
    titleKey: "homeAreaAiTitle",
    descriptionKey: "homeAreaAiDescription",
    bullets: [
      "Privacy-preserving federated learning and secure multi-party computation.",
      "Auditing neural networks for robustness against adversarial evasion attacks.",
      "Adversarial vulnerability shielding in generative and predictive models.",
    ],
    tags: ["ML", "Federated", "Robustness"],
    icon: BrainCircuit,
  },
] as const;

const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

type HomeLandingProps = {
  settings: SiteSettings;
  publications: Publication[];
  members: Member[];
};

export function HomeLanding({
  settings,
  publications,
  members,
}: HomeLandingProps) {
  const featuredPublications = useMemo(() => {
    const featured = publications.filter(
      (publication) => publication.isFeatured,
    );
    return (featured.length ? featured : publications).slice(0, 4);
  }, [publications]);

  return (
    <div className="overflow-hidden bg-background text-foreground">
      <Hero />
      <PrincipalInvestigator settings={settings} />
      <ResearchAreas />
      <FeaturedPublications publications={featuredPublications} />
      <MembersPreview members={members} />
      <JoinCallToAction />
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(8,145,178,0.12),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(217,154,43,0.12),transparent_26%),linear-gradient(180deg,var(--color-background),var(--color-surface-muted))]" />
      <div
        className="academic-grid absolute inset-0 -z-10 opacity-70"
        aria-hidden="true"
      />

      <div className="mx-auto grid min-h-[calc(100svh-73px)] max-w-7xl gap-12 px-6 py-16 md:min-h-[640px] md:grid-cols-[1.08fr_0.92fr] md:items-center md:py-20 lg:gap-16">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="min-w-0 max-w-3xl"
        >
          <motion.p
            variants={reveal}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-sm"
          >
            {t("homeHeroEyebrow")}
          </motion.p>

          <motion.h1
            variants={reveal}
            className="mt-6 text-3xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
          >
            {t("homeHeroTitle")}{" "}
            <span className="hero-highlight-text">
              {t("homeHeroHighlight")}
            </span>
          </motion.h1>

          <motion.p
            variants={reveal}
            className="mt-6 max-w-xl text-sm leading-7 text-muted md:text-base"
          >
            {t("homeHeroDescription")}
          </motion.p>

          <motion.div variants={reveal} className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#publications"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_45px_rgba(8,145,178,0.24)] transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t("explorePublications")}
            </Link>
            <Link
              href="#members"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary/25"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              {t("homeMeetTeam")}
            </Link>
          </motion.div>

          <motion.div variants={reveal} className="mt-8 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs font-medium text-muted shadow-sm"
              >
                {keyword}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-w-0"
        >
          <ResearchVisual />
        </motion.div>
      </div>
    </section>
  );
}

function ResearchVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // cursor x
    const y = e.clientY - rect.top; // cursor y

    // Normalize coordinates from -0.5 to 0.5
    const normalizedX = x / rect.width - 0.5;
    const normalizedY = y / rect.height - 0.5;

    // Calculate rotation offset: tilt up to 15 degrees
    setRotateX(-normalizedY * 30);
    setRotateY(normalizedX * 30);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  // Base isometric angles
  const baseRotateX = 54;
  const baseRotateZ = -40;

  // Transform matrices for true 3D stack
  const transformWrapper = isHovered
    ? `rotateX(${baseRotateX + rotateX}deg) rotateY(${rotateY}deg) rotateZ(${baseRotateZ}deg)`
    : `rotateX(${baseRotateX}deg) rotateY(0deg) rotateZ(${baseRotateZ}deg)`;

  return (
    <div className="relative mx-auto w-full max-w-[500px] aspect-square flex items-center justify-center select-none">
      {/* Deep holographic backdrop glows */}
      <div
        className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "6s" }}
      />

      {/* Main Isometric Stack Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-full max-w-[440px] h-[440px] flex items-center justify-center [perspective:1200px] cursor-grab active:cursor-grabbing"
      >
        <div
          className="relative w-full h-full [transform-style:preserve-3d] transition-transform duration-300 ease-out"
          style={{ transform: transformWrapper }}
        >
          {/* Layer 1: Protocol (Bottom Layer) */}
          <div
            className="absolute inset-0 m-auto w-[310px] h-[160px] rounded-2xl border border-primary/20 bg-surface/35 shadow-lg backdrop-blur-md transition-transform duration-500 ease-out [transform-style:preserve-3d]"
            style={{
              transform: isHovered
                ? "translateZ(-110px) translateX(-20px) translateY(20px)"
                : "translateZ(-60px)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--color-primary-soft)_0%,transparent_70%)] opacity-30" />
            <div className="p-5 h-full flex flex-col justify-between [transform:translateZ(10px)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                  Layer 1: Protocol
                </span>
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                  Consensus & Network
                </h4>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Decentralized ledgers, sharding, and P2P routing protocols.
                </p>
              </div>
            </div>
            {/* Holographic grid dots on card */}
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(rgba(8,123,149,0.15)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            {/* Glowing active node */}
            <div className="absolute top-4 right-4 flex gap-1 [transform:translateZ(15px)]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </div>

          {/* Layer 2: Execution (Middle Layer) */}
          <div
            className="absolute inset-0 m-auto w-[310px] h-[160px] rounded-2xl border border-accent/20 bg-surface/45 shadow-xl backdrop-blur-md transition-transform duration-500 ease-out [transform-style:preserve-3d]"
            style={{
              transform: "translateZ(0px)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(217,154,43,0.1)_0%,transparent_60%)]" />
            <div className="p-5 h-full flex flex-col justify-between [transform:translateZ(15px)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">
                  Layer 2: Execution
                </span>
                <Link2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                  Smart Contract Logic
                </h4>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Formal verification, audit frameworks, and Web Assembly
                  execution.
                </p>
              </div>
            </div>
          </div>

          {/* Layer 3: Security (Top Layer) */}
          <div
            className="absolute inset-0 m-auto w-[310px] h-[160px] rounded-2xl border border-cyan-400/20 bg-surface/55 shadow-2xl backdrop-blur-lg transition-transform duration-500 ease-out [transform-style:preserve-3d]"
            style={{
              transform: isHovered
                ? "translateZ(110px) translateX(20px) translateY(-20px)"
                : "translateZ(60px)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(6,182,212,0.1)_0%,transparent_60%)]" />
            <div className="p-5 h-full flex flex-col justify-between [transform:translateZ(20px)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                  Layer 3: Security
                </span>
                <ShieldCheck className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                  Trustworthy AI & Zero-Knowledge
                </h4>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Privacy-preserving AI, cryptographic proofs, and vulnerability
                  shields.
                </p>
              </div>
            </div>
            {/* Tech glowing node */}
            <div className="absolute bottom-4 right-4 flex gap-1 [transform:translateZ(15px)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrincipalInvestigator({ settings }: { settings: SiteSettings }) {
  const { t } = useTranslation();
  const principalInvestigator = settings.principalInvestigator;

  return (
    <SectionShell id="pi">
      <SectionHeading eyebrow={t("homePiEyebrow")} title={t("homePiTitle")} />
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="pi-glow-container mt-10 rounded-[2rem] p-8 md:p-12 shadow-sm"
      >
        {/* Decorative background glow */}
        <div className="pi-card-glow-bg" aria-hidden="true" />
        <div
          className="academic-grid absolute inset-0 -z-10 opacity-30"
          aria-hidden="true"
        />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[260px_1fr] lg:gap-14 items-center">
          {/* Left Column: Interactive Badge & Name */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="pi-badge-wrapper"
            >
              <div className="pi-badge-outer-ring" />
              <div className="pi-badge-middle-ring" />
              <div className="pi-badge-inner-core">
                <Image
                  src={principalInvestigator.avatarUrl ?? "/tuandung-tran.png"}
                  alt={principalInvestigator.name}
                  width={150}
                  height={150}
                  className="pi-badge-photo"
                />
                <div className="pi-badge-pulse-node">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                </div>
              </div>
            </motion.div>

            <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
              {principalInvestigator.name}
            </h3>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted leading-relaxed">
              {principalInvestigator.title}
            </p>
          </div>

          {/* Right Column: Bio details */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
              {principalInvestigator.title}
            </h2>

            {/* Glassmorphic Quotes Box */}
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-surface-muted/50 p-6 mt-6 backdrop-blur-sm">
              <Quote className="absolute right-4 bottom-2 h-20 w-20 text-primary/5 opacity-10 pointer-events-none" />
              <p className="font-sans text-sm md:text-base italic leading-relaxed text-foreground/85 relative z-10">
                &ldquo;{t("homePiQuote")}&rdquo;
              </p>
            </div>

            <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
              {principalInvestigator.bio}
            </p>

            {/* Refined outlined chip tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              {principalInvestigator.researchInterests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/10 bg-primary-soft/30 px-3.5 py-1.5 text-xs font-medium text-primary transition-all duration-300 hover:border-primary/30 hover:bg-primary-soft/60 hover:scale-[1.02] cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Glowing & polished button links */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`https://orcid.org/${settings.orcidId}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_32px_rgba(8,123,149,0.2)] transition-all duration-300 hover:bg-primary/95 hover:shadow-[0_16px_40px_rgba(8,123,149,0.3)] hover:-translate-y-0.5"
              >
                ORCID <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              {settings.googleScholarUrl ? (
                <a
                  href={settings.googleScholarUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-surface-muted hover:-translate-y-0.5"
                >
                  Google Scholar{" "}
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}

function ResearchAreas() {
  const { t } = useTranslation();
  return (
    <SectionShell id="research" className="relative bg-surface-muted">
      {/* Ambient background */}
      <div
        className="academic-grid absolute inset-0 -z-10 opacity-[0.12] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl text-center">
        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {t("homeResearchEyebrow")}
        </motion.p>
        <motion.h2
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-6xl"
        >
          {t("homeResearchTitle")}{" "}
          <span className="hero-highlight-text">
            {t("homeResearchHighlight")}
          </span>
        </motion.h2>
        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted md:text-base"
        >
          {t("homeResearchDescription")}
        </motion.p>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto mt-16 grid max-w-5xl gap-5 md:grid-cols-2"
      >
        {researchAreas.map((area, index) => (
          <ResearchAreaCard key={area.titleKey} area={area} index={index} />
        ))}
      </motion.div>
    </SectionShell>
  );
}

function ResearchAreaCard({
  area,
  index,
}: {
  area: (typeof researchAreas)[number];
  index: number;
}) {
  const { t } = useTranslation();
  const Icon = area.icon;

  return (
    <motion.article
      variants={reveal}
      className="group relative min-h-56 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-[0_18px_44px_rgba(8,123,149,0.1)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs font-semibold text-primary">
          0{index + 1} / 04
        </span>
        <div className="rounded-xl border border-primary/15 bg-primary-soft p-2 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">
        {t(area.titleKey)}
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        {t(area.descriptionKey)}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {area.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

function FeaturedPublications({
  publications,
}: {
  publications: Publication[];
}) {
  const { t } = useTranslation();
  return (
    <SectionShell id="publications" className="bg-surface-muted">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow={t("homeFeaturedPublications")}
          title={t("homeRecentOutputs")}
          description={t("homeFeaturedDescription")}
        />
        <SectionLink href="/publications">
          {t("homeViewAllPublications")}
        </SectionLink>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-10 grid gap-4"
      >
        {publications.length ? (
          publications.map((publication, index) => (
            <PublicationRow
              key={publication.id}
              publication={publication}
              index={index}
            />
          ))
        ) : (
          <EmptyLandingState
            title={t("homeNoPublications")}
            description={t("homeFeaturedEmptyDescription")}
          />
        )}
      </motion.div>
    </SectionShell>
  );
}

function PublicationRow({
  publication,
  index,
}: {
  publication: Publication;
  index: number;
}) {
  const { t } = useTranslation();
  return (
    <motion.article
      variants={reveal}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          "--spot-x",
          `${e.clientX - r.left}px`,
        );
        e.currentTarget.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
      }}
      className="spotlight-card group relative grid items-center gap-5 overflow-hidden rounded-[1.5rem] border border-border bg-surface p-6 shadow-sm transition-all duration-400 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_18px_44px_rgba(8,123,149,0.1)] md:grid-cols-[auto_120px_1fr_auto]"
    >
      <div className="spotlight-card-glow" aria-hidden="true" />

      {/* Index marker with accent bar */}
      <div className="relative z-10 hidden items-center gap-4 md:flex">
        <span className="font-mono text-2xl font-bold text-primary/25 transition-colors duration-300 group-hover:text-primary/60">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className="h-12 w-px bg-border transition-colors duration-300 group-hover:bg-primary/40"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 flex items-center gap-3 md:block">
        <span className="inline-flex rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          {publication.type ?? t("publicationsEyebrow")}
        </span>
        <p className="font-mono text-sm text-muted md:mt-3">
          {publication.year ?? "N/A"}
        </p>
      </div>

      <div className="relative z-10">
        <h3 className="text-lg font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-primary">
          {publication.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          {publication.authors.join(", ") || t("publicationAuthorsPending")}
        </p>
        {publication.venue ? (
          <p className="mt-1 text-sm font-medium text-primary">
            {publication.venue}
          </p>
        ) : null}
        {publication.doi ? (
          <p className="mt-2 truncate font-mono text-xs text-muted">
            {publication.doi}
          </p>
        ) : null}
      </div>

      {publication.url ? (
        <a
          href={publication.url}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:gap-3 hover:bg-secondary/90 dark:bg-primary dark:text-primary-foreground"
        >
          {t("publicationView")}{" "}
          <ExternalLink
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </a>
      ) : null}
    </motion.article>
  );
}

function MembersPreview({ members }: { members: Member[] }) {
  const { t } = useTranslation();
  const previewMembers = members.slice(0, 4);

  return (
    <SectionShell id="members">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow={t("homeContributors")}
          title={t("homeContributorsTitle")}
          description={t("homeContributorsDescription")}
        />
        <SectionLink href="/members">{t("homeViewContributors")}</SectionLink>
      </div>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {previewMembers.length ? (
          previewMembers.map((member) => (
            <MemberPreviewCard key={member.id} member={member} />
          ))
        ) : (
          <EmptyLandingState
            title={t("homeContributorsEmptyTitle")}
            description={t("homeContributorsEmptyDescription")}
          />
        )}
      </motion.div>
    </SectionShell>
  );
}

function MemberPreviewCard({ member }: { member: Member }) {
  const { t } = useTranslation();
  const socials = [
    member.links.googleScholar && {
      href: member.links.googleScholar,
      label: "Scholar",
      icon: BookOpen,
    },
    member.links.orcid && {
      href: member.links.orcid,
      label: "ORCID",
      icon: ExternalLink,
    },
    member.links.webOfScience && {
      href: member.links.webOfScience,
      label: "Web of Science",
      icon: ExternalLink,
    },
    member.links.scopus && {
      href: member.links.scopus,
      label: "Scopus",
      icon: ExternalLink,
    },
    member.links.website && {
      href: member.links.website,
      label: "Website",
      icon: Link2,
    },
    member.links.github && {
      href: member.links.github,
      label: "GitHub",
      icon: GitBranch,
    },
  ].filter(Boolean) as { href: string; label: string; icon: typeof BookOpen }[];
  const education = member.education.slice(0, 1);
  const achievements = member.achievements.slice(0, 1);

  return (
    <motion.article
      variants={reveal}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative overflow-hidden rounded-[1.5rem] border border-border bg-surface p-6 shadow-sm transition-colors duration-500 hover:border-primary/30 hover:shadow-[0_22px_50px_rgba(8,123,149,0.12)]"
    >
      {/* Top accent that grows on hover */}
      <span
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent transition-transform duration-500 group-hover:scale-x-100"
        aria-hidden="true"
      />

      {/* Avatar with rotating gradient ring */}
      <div className="member-avatar-ring relative h-20 w-20 rounded-full p-[2px]">
        <div
          className="grid h-full w-full place-items-center overflow-hidden rounded-full border border-surface bg-primary-soft bg-cover bg-center text-2xl font-semibold text-primary"
          style={
            member.avatar?.url
              ? { backgroundImage: `url(${member.avatar.url})` }
              : undefined
          }
          aria-label={member.name}
        >
          {member.avatar?.url ? null : initials(member.name)}
        </div>
      </div>

      {member.hasPublicProfile ? (
        <Link
          href={`/members/${member.slug}`}
          className="mt-5 block text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-primary hover:underline"
        >
          {member.name}
        </Link>
      ) : (
        <h3 className="mt-5 text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
          {member.name}
        </h3>
      )}
      <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
      {typeof member.publicationCount === "number" ? (
        <p className="mt-1 text-xs font-medium text-muted">
          {member.publicationCount === 1
            ? t("publicationCountOne")
            : t("publicationCount", { count: member.publicationCount })}
        </p>
      ) : null}
      {member.bio ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {member.bio}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {member.researchInterests.slice(0, 3).map((interest) => (
          <span
            key={interest}
            className="rounded-full border border-border px-2 py-1 text-[11px] text-muted transition-colors duration-300 group-hover:border-primary/20 group-hover:text-foreground"
          >
            {interest}
          </span>
        ))}
      </div>

      {education.length ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("profileEducation")}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
            {education[0]}
          </p>
        </div>
      ) : null}

      {achievements.length ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("profileAchievements")}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
            {achievements[0]}
          </p>
        </div>
      ) : null}

      {socials.length ? (
        <div className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
          {socials.map(({ href, label, icon: SocialIcon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface-muted text-muted transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
            >
              <SocialIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : null}
    </motion.article>
  );
}

function JoinCallToAction() {
  const { t } = useTranslation();
  const joinSteps = [
    {
      icon: BookOpen,
      title: t("homeJoinStepRead"),
      detail: t("homeJoinStepReadDetail"),
    },
    {
      icon: FlaskConical,
      title: t("homeJoinStepExperiment"),
      detail: t("homeJoinStepExperimentDetail"),
    },
    {
      icon: Network,
      title: t("homeJoinStepBuild"),
      detail: t("homeJoinStepBuildDetail"),
    },
  ];
  return (
    <SectionShell id="join">
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-8 shadow-[0_24px_70px_rgba(8,123,149,0.08)] md:p-14"
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,154,43,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(8,123,149,0.12),transparent_50%)]"
          aria-hidden="true"
        />
        <div
          className="academic-grid absolute inset-0 opacity-20"
          aria-hidden="true"
        />

        <div className="relative">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              {t("homeRecruitment")}
            </p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              {t("homeJoinHeadline")}{" "}
              <span className="hero-highlight-text">
                {t("homeJoinHighlight")}
              </span>
            </h2>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 grid gap-4 md:grid-cols-3"
          >
            {joinSteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={reveal}
                  className="group rounded-2xl border border-border bg-surface-muted/50 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-surface"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/15 bg-primary-soft/60 text-primary transition-transform duration-300 group-hover:scale-110">
                    <StepIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {step.detail}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
          <div className="mt-8 flex">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_45px_rgba(8,145,178,0.2)] transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {t("homeApply")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}

function SectionShell({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">{children}</div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="max-w-5xl py-1"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary-soft/50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-[1.15]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-sm leading-7 text-muted md:text-base max-w-2xl">
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}

function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground"
    >
      {children} <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function EmptyLandingState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={reveal}
      className="rounded-[1.5rem] border border-border bg-surface p-8 text-center shadow-sm md:col-span-full"
    >
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted">
        {description}
      </p>
    </motion.div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

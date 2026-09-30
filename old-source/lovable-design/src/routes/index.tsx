import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield, Link2, Wifi, BrainCircuit, Mail, ExternalLink, FileText,
  ArrowRight, GraduationCap, Users, BookOpen, FlaskConical, Github,
  Menu, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import heroImg from "@/assets/hero-network.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blockchainist Research Group — Blockchain, Security & Intelligent Systems" },
      { name: "description", content: "University research group advancing blockchain, cybersecurity, IoT, 5G/6G and AI for security." },
      { property: "og:title", content: "Blockchainist Research Group" },
      { property: "og:description", content: "Advancing secure, decentralized and intelligent infrastructures." },
    ],
  }),
  component: Index,
});

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Research", href: "#research" },
  { label: "Publications", href: "#publications" },
  { label: "Members", href: "#members" },
  { label: "Projects", href: "#projects" },
  { label: "Join Us", href: "#join" },
  { label: "Contact", href: "#contact" },
];

const KEYWORDS = ["Blockchain", "Cybersecurity", "IoT", "5G/6G", "Smart Contracts", "AI Security"];

const STATS = [
  { value: "40+", label: "Publications" },
  { value: "5", label: "Research Areas" },
  { value: "10+", label: "Members" },
  { value: "2020+", label: "Active Research" },
];

const AREAS = [
  { icon: Link2, title: "Blockchain & Smart Contracts", desc: "Decentralized protocols, consensus, verifiable computation and smart contract security.", tags: ["Consensus", "DeFi", "Formal Verification"] },
  { icon: Shield, title: "Cybersecurity & Network Security", desc: "Threat modeling, intrusion detection, secure protocols and applied cryptography.", tags: ["IDS", "Crypto", "Zero Trust"] },
  { icon: Wifi, title: "5G/6G Networks & IoT", desc: "Secure architectures for next-generation wireless, edge computing and IoT systems.", tags: ["Edge", "SDN", "NFV"] },
  { icon: BrainCircuit, title: "AI for Security & Privacy", desc: "Machine learning for anomaly detection, adversarial robustness and privacy preservation.", tags: ["ML", "Federated", "Adversarial"] },
];

const PUBS = [
  { type: "Journal", year: "2025", title: "Privacy-Preserving Federated Learning over Permissioned Blockchains", authors: "A. Researcher, B. Student, C. Professor", venue: "IEEE Transactions on Information Forensics and Security" },
  { type: "Conference", year: "2024", title: "Lightweight Intrusion Detection for 5G Slicing using Graph Neural Networks", authors: "B. Student, C. Professor", venue: "ACM CCS 2024" },
  { type: "Journal", year: "2024", title: "Verifiable Smart Contract Auditing via Symbolic Execution", authors: "C. Professor, D. PhD", venue: "ACM Computing Surveys" },
  { type: "Conference", year: "2023", title: "Edge-Native Blockchain for IoT Device Identity", authors: "D. PhD, C. Professor", venue: "IEEE INFOCOM 2023" },
];

const MEMBERS = [
  { name: "Dr. [Professor Name]", role: "Principal Investigator", tags: ["Blockchain", "Security"] },
  { name: "Jane Doe", role: "PhD Student", tags: ["5G Security", "ML"] },
  { name: "John Lee", role: "Master Student", tags: ["Smart Contracts"] },
  { name: "Aisha Khan", role: "Undergraduate Researcher", tags: ["IoT"] },
];

const PROJECTS = [
  { title: "Blockchain for IoT Security", desc: "Decentralized device identity and integrity attestation for large-scale IoT deployments.", status: "Ongoing" },
  { title: "AI-based Intrusion Detection in 5G Networks", desc: "Graph-neural-network IDS for network slices and control-plane anomalies.", status: "Open for Students" },
  { title: "Privacy-preserving Federated Learning", desc: "Secure aggregation with differential privacy across heterogeneous edge devices.", status: "Ongoing" },
];

function Index() {
  return (
    <div id="home" className="min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <Hero />
      <Stats />
      <PI />
      <ResearchAreas />
      <Publications />
      <Members />
      <Projects />
      <Join />
      <Contact />
      <Footer />
    </div>
  );
}

/* ---------- Navbar ---------- */
function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#home" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold">Blockchainist</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Research Group</div>
          </div>
        </a>
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map(n => (
            <a key={n.href} href={n.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{n.label}</a>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <a href="#publications"><FileText className="mr-2 h-4 w-4" />View Publications</a>
          </Button>
        </div>
        <button onClick={() => setOpen(v => !v)} className="rounded-md p-2 lg:hidden" aria-label="menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background/95 px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {NAV.map(n => (
              <a key={n.href} onClick={() => setOpen(false)} href={n.href} className="text-sm text-muted-foreground hover:text-foreground">{n.label}</a>
            ))}
            <Button asChild size="sm" className="mt-2 bg-primary text-primary-foreground"><a href="#publications">View Publications</a></Button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-32">
        <div>
          <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 text-primary">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-primary" /> Academic Research · University Lab
          </Badge>
          <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl lg:text-6xl">
            Blockchain, Network Security &{" "}
            <span className="text-gradient">Intelligent Systems</span> Research Group
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Advancing secure, decentralized and intelligent infrastructures for the next generation of digital systems.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90">
              <a href="#publications"><FileText className="mr-2 h-4 w-4" />View Publications</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border bg-card/40 hover:bg-card">
              <a href="#join"><GraduationCap className="mr-2 h-4 w-4" />Join Our Lab</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {KEYWORDS.map(k => (
              <span key={k} className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                {k}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl opacity-50 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
          <div className="glass-card relative overflow-hidden rounded-2xl">
            <img src={heroImg} alt="Blockchain network visualization" width={1024} height={1024} className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Stats ---------- */
function Stats() {
  return (
    <section className="border-y border-border/60 bg-card/20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden bg-border/40 md:grid-cols-4">
        {STATS.map(s => (
          <div key={s.label} className="bg-background/60 px-6 py-10 text-center">
            <div className="font-display text-3xl font-semibold text-gradient md:text-4xl">{s.value}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- PI ---------- */
function PI() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading eyebrow="Principal Investigator" title="Leadership & Vision" />
      <div className="glass-card mt-12 grid gap-8 rounded-2xl p-8 md:grid-cols-[auto,1fr] md:p-12">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full opacity-60 blur-xl" style={{ background: "var(--gradient-primary)" }} />
            <div className="relative grid h-32 w-32 place-items-center rounded-full border border-border bg-card font-display text-3xl">PN</div>
          </div>
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold">Assoc. Prof. Dr. [Professor Name]</h3>
          <div className="mt-1 text-sm text-primary">Principal Investigator</div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Dr. [Professor Name] leads research at the intersection of distributed systems, applied cryptography, and machine learning.
            Their work focuses on secure blockchain infrastructure, network defense for 5G/6G, and privacy-preserving AI, with publications
            across IEEE, ACM and Springer venues.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Blockchain", "Applied Cryptography", "Network Security", "Federated Learning", "5G/6G"].map(t => (
              <Badge key={t} variant="secondary" className="bg-secondary/15 text-secondary border border-secondary/20">{t}</Badge>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="bg-card/40"><ExternalLink className="mr-2 h-3.5 w-3.5" />ORCID</Button>
            <Button size="sm" variant="outline" className="bg-card/40"><BookOpen className="mr-2 h-3.5 w-3.5" />Google Scholar</Button>
            <Button size="sm" variant="outline" className="bg-card/40"><Mail className="mr-2 h-3.5 w-3.5" />Email</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Research Areas ---------- */
function ResearchAreas() {
  return (
    <section id="research" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading eyebrow="Research Areas" title="Where we focus our work" description="Four interlinked tracks that span theory, systems and applied security." />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {AREAS.map(a => {
          const Icon = a.icon;
          return (
            <div key={a.title} className="glass-card group rounded-2xl p-7 transition-all hover:-translate-y-0.5 hover:border-primary/30">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {a.tags.map(t => (
                      <span key={t} className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Publications ---------- */
function Publications() {
  return (
    <section id="publications" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading eyebrow="Featured Publications" title="Selected recent papers" />
      <div className="mt-12 grid gap-5">
        {PUBS.map((p, i) => (
          <article key={i} className="glass-card flex flex-col gap-4 rounded-2xl p-6 transition-colors hover:border-primary/30 md:flex-row md:items-center md:p-7">
            <div className="flex shrink-0 items-center gap-3 md:flex-col md:items-start">
              <Badge className={p.type === "Journal" ? "bg-primary/15 text-primary border border-primary/20" : "bg-secondary/15 text-secondary border border-secondary/20"}>
                {p.type}
              </Badge>
              <span className="text-xs text-muted-foreground">{p.year}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold leading-snug md:text-lg">{p.title}</h3>
              <div className="mt-1.5 text-sm text-muted-foreground">{p.authors}</div>
              <div className="mt-0.5 text-xs italic text-muted-foreground/80">{p.venue}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="bg-card/40"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />DOI</Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">View Paper <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- Members ---------- */
function Members() {
  return (
    <section id="members" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading eyebrow="Members" title="The people behind the research" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MEMBERS.map(m => (
          <div key={m.name} className="glass-card rounded-2xl p-6 text-center transition-all hover:-translate-y-0.5">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-card font-display text-xl">
              {m.name.split(" ").map(s => s[0]).slice(0,2).join("")}
            </div>
            <h4 className="mt-4 font-display text-base font-semibold">{m.name}</h4>
            <div className="text-xs text-primary">{m.role}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {m.tags.map(t => (
                <span key={t} className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Projects ---------- */
function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading eyebrow="Current Projects" title="Ongoing research topics" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PROJECTS.map(p => (
          <div key={p.title} className="glass-card flex flex-col rounded-2xl p-7 transition-all hover:-translate-y-0.5 hover:border-primary/30">
            <div className="mb-4 flex items-center justify-between">
              <FlaskConical className="h-5 w-5 text-primary" />
              <Badge className={p.status === "Ongoing" ? "bg-primary/15 text-primary border border-primary/20" : "bg-secondary/15 text-secondary border border-secondary/20"}>
                {p.status}
              </Badge>
            </div>
            <h3 className="font-display text-lg font-semibold">{p.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            <a href="#contact" className="mt-5 inline-flex items-center text-sm text-primary hover:underline">Learn more <ArrowRight className="ml-1 h-3.5 w-3.5" /></a>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Join ---------- */
function Join() {
  return (
    <section id="join" className="mx-auto max-w-7xl px-6 py-24">
      <div className="glass-card relative overflow-hidden rounded-3xl p-10 md:p-16">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr,1fr]">
          <div>
            <Badge variant="outline" className="border-secondary/30 bg-secondary/5 text-secondary">Recruiting</Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">Join Our Lab</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              We welcome motivated students interested in blockchain, cybersecurity, AI, networking and web3 systems.
              Openings are available for PhD, Master, and undergraduate researchers.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["PhD positions", "Master thesis", "Undergrad research", "Visiting researchers"].map(t => (
                <span key={t} className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          </div>
          <div className="md:justify-self-end">
            <Button asChild size="lg" className="bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90">
              <a href="#contact"><Users className="mr-2 h-4 w-4" />Apply Now</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact ---------- */
function Contact() {
  const [submitting, setSubmitting] = useState(false);
  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading eyebrow="Contact" title="Get in touch" />
      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr,1.4fr]">
        <div className="glass-card rounded-2xl p-7">
          <h3 className="font-display text-lg font-semibold">Lab Contact</h3>
          <div className="mt-5 space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-primary" /> contact@blockchainist.lab</div>
            <div className="flex items-start gap-3"><GraduationCap className="mt-0.5 h-4 w-4 text-primary" /> Dept. of Computer Science<br />University Campus, Building X</div>
            <div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-4 w-4 text-primary" /> Office hours: Tue / Thu 14:00 – 16:00</div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button size="icon" variant="outline" className="bg-card/40"><Github className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" className="bg-card/40"><BookOpen className="h-4 w-4" /></Button>
            <Button size="icon" variant="outline" className="bg-card/40"><ExternalLink className="h-4 w-4" /></Button>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            setTimeout(() => { setSubmitting(false); toast.success("Message sent. We'll get back to you soon."); (e.target as HTMLFormElement).reset(); }, 600);
          }}
          className="glass-card grid gap-4 rounded-2xl p-7 sm:grid-cols-2"
        >
          <Field label="Full name"><Input required maxLength={100} placeholder="Jane Doe" /></Field>
          <Field label="Email"><Input required type="email" maxLength={255} placeholder="jane@uni.edu" /></Field>
          <Field label="School / Major"><Input maxLength={150} placeholder="CS, Year 3" /></Field>
          <Field label="Interested topic"><Input maxLength={150} placeholder="Blockchain security" /></Field>
          <div className="sm:col-span-2">
            <Field label="Message"><Textarea required maxLength={1000} rows={5} placeholder="Tell us about your interests and background." /></Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
              {submitting ? "Sending…" : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/* ---------- Footer ---------- */
function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/20">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="font-display font-semibold">Blockchainist Research Group</div>
          </div>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            A university research group advancing secure, decentralized and intelligent infrastructures.
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Quick Links</div>
          <ul className="space-y-2 text-sm">
            {NAV.slice(1).map(n => (
              <li key={n.href}><a href={n.href} className="text-muted-foreground hover:text-foreground">{n.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Connect</div>
          <ul className="space-y-2 text-sm">
            <li><a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground" href="#"><ExternalLink className="h-3.5 w-3.5" />ORCID</a></li>
            <li><a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground" href="#"><BookOpen className="h-3.5 w-3.5" />Google Scholar</a></li>
            <li><a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground" href="#"><Github className="h-3.5 w-3.5" />GitHub</a></li>
            <li><a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground" href="#"><Mail className="h-3.5 w-3.5" />Email</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Blockchainist Research Group. All rights reserved.
      </div>
    </footer>
  );
}

/* ---------- Shared ---------- */
function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-primary">
        <span className="h-px w-8 bg-primary/50" /> {eyebrow}
      </div>
      <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-sm text-muted-foreground md:text-base">{description}</p>}
    </div>
  );
}

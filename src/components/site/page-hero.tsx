"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";

const reveal: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

type PageHeroProps = {
  eyebrow: string;
  /** Plain title text. */
  title: string;
  /** Optional trailing fragment rendered with the gradient highlight treatment. */
  highlight?: string;
  description?: string;
  /** Optional actions / extra content rendered under the description. */
  children?: ReactNode;
};

export function PageHero({ eyebrow, title, highlight, description, children }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-surface-muted/40">
      {/* Ambient background */}
      <div className="academic-grid absolute inset-0 -z-10 opacity-[0.12]" aria-hidden="true" />
      <div className="absolute -top-24 left-1/2 -z-10 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-7xl px-6 py-16 md:py-20"
      >
        <motion.div
          variants={reveal}
          className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {eyebrow}
        </motion.div>

        <motion.h1
          variants={reveal}
          className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
        >
          {title}
          {highlight ? (
            <>
              {" "}
              <span className="hero-highlight-text">{highlight}</span>
            </>
          ) : null}
        </motion.h1>

        {description ? (
          <motion.p variants={reveal} className="mt-5 max-w-2xl text-sm leading-7 text-muted md:text-base">
            {description}
          </motion.p>
        ) : null}

        {children ? (
          <motion.div variants={reveal} className="mt-8">
            {children}
          </motion.div>
        ) : null}
      </motion.div>
    </section>
  );
}

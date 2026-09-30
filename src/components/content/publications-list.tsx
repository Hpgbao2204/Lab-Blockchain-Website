"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PublicationCard } from "./publication-card";
import type { Publication } from "@/types/content";
import { useTranslation } from "@/components/i18n/locale-provider";

type PublicationsListProps = {
  initialPublications: Publication[];
};

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

export function PublicationsList({ initialPublications }: PublicationsListProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Get all unique publication types for filter buttons
  const publicationTypes = useMemo(() => {
    const types = new Set<string>();
    initialPublications.forEach((pub) => {
      if (pub.type) {
        types.add(pub.type);
      }
    });
    return ["all", ...Array.from(types)];
  }, [initialPublications]);

  // Filter and sort publications
  const filteredAndSortedPublications = useMemo(() => {
    let result = [...initialPublications];

    // Search query filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (pub) =>
          pub.title.toLowerCase().includes(query) ||
          pub.authors.some((author) => author.toLowerCase().includes(query)) ||
          (pub.venue && pub.venue.toLowerCase().includes(query)) ||
          (pub.doi && pub.doi.toLowerCase().includes(query))
      );
    }

    // Type filtering
    if (selectedType !== "all") {
      result = result.filter((pub) => pub.type === selectedType);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return (b.year ?? 0) - (a.year ?? 0);
      }
      if (sortBy === "oldest") {
        return (a.year ?? 0) - (b.year ?? 0);
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  }, [initialPublications, searchQuery, selectedType, sortBy]);

  return (
    <div className="space-y-8">
      {/* Control Panel: Search & Filters */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            placeholder="Search by title, author, venue, DOI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filter Select */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted shrink-0" />
          <Select
            className="w-full sm:w-48"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">{t("publicationAllTypes")}</option>
            {publicationTypes
              .filter((type) => type !== "all")
              .map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
          </Select>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted shrink-0" />
          <Select
            className="w-full sm:w-48"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="newest">{t("publicationNewest")}</option>
            <option value="oldest">{t("publicationOldest")}</option>
            <option value="title-asc">{t("publicationTitleAscending")}</option>
            <option value="title-desc">{t("publicationTitleDescending")}</option>
          </Select>
        </div>
      </div>

      {/* Filter Quick Pills */}
      {publicationTypes.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {publicationTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                selectedType === type
                  ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(8,123,149,0.15)]"
                  : "border border-border bg-surface text-muted hover:bg-surface-muted"
              }`}
            >
              {type === "all" ? t("publicationAll") : type}
            </button>
          ))}
        </div>
      )}

      {/* Results Count & Empty State */}
      <div className="flex justify-between items-center border-b border-border/60 pb-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {t("publicationShowing", { shown: filteredAndSortedPublications.length, total: initialPublications.length })}
        </span>
        {(searchQuery || selectedType !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedType("all");
              setSortBy("newest");
            }}
            className="text-xs font-bold text-primary hover:underline"
          >
            {t("publicationReset")}
          </button>
        )}
      </div>

      {/* Publications Grid */}
      <AnimatePresence mode="popLayout">
        {filteredAndSortedPublications.length > 0 ? (
          <motion.div
            layout
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            {filteredAndSortedPublications.map((publication) => (
              <motion.div
                key={publication.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <PublicationCard publication={publication} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-dashed border-border py-14 text-center"
          >
            <p className="text-base font-semibold text-foreground">{t("publicationNoMatchTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("publicationNoMatchDescription")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

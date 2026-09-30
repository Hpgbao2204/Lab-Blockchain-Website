# ORCID Contributor Members

## Goal

Show the principal investigator's supplied avatar on the homepage and make the public member experience reflect unique contributors from the published ORCID-synced publications.

## Data Flow

- Keep `publications` as the source of contributor names. Only `isPublished` publications participate.
- Derive one public contributor per normalized author name at request time.
- Set each derived contributor's publication count from the number of published works that contain that name.
- Read `members` as optional manual profile enrichment. When a normalized manual member name matches a contributor, preserve the manual profile fields and attach the calculated publication count.
- Retain manual members who are active even if they have no matching ORCID publication, so explicit research-group profiles are not hidden.
- Do not create or backfill a contributors collection. Do not infer biographical data for author-only records.

## Public UI

- Place the supplied portrait in `public/` and use it as the fallback PI avatar in homepage settings.
- Replace homepage placeholder counts with exact runtime counts for published works, unique contributors, and projects.
- Rename public member copy from managed member profiles to research contributors.
- Show a contributor's publication count in member cards when it is available.

## Admin Behavior

- Keep existing `members` CRUD unchanged. It manages optional profile enrichment, not the ORCID contributor source.
- Keep publication visibility (`isPublished`) as the source filter for public contributor data.

## Error Handling

- Empty publications produce an empty contributor list and zero publication/contributor counts.
- Empty or duplicate author strings are ignored after trimming and case-insensitive normalization.
- Manual profiles continue to render when Firestore has no publications.

## Verification

- Unit test derived contributor deduplication and per-author publication count.
- Unit test manual profile enrichment and retention of unmatched active profiles.
- Run typecheck, lint, test, and production build.

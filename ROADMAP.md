# MediMatch Roadmap

MediMatch is a drug–drug interaction lookup built on the public DDInter dataset. It stores no user data: no accounts, no saved searches, no patient records. Everything below keeps it that way.

Items are in priority order. Each one has (or will have) a matching GitHub issue.

## 1. Safety fixes

These come first, because a drug checker must never look "safe" when it doesn't actually know.

- [ ] **Treat database errors as errors, not "no interaction".** Today, if the Supabase query fails, the API returns severity `None`, which the UI shows as safe. It should return an error and the UI should say "We couldn't check this pair. Please try again."
- [ ] **Separate "no known interaction" from "drug not in our data".** If either drug isn't in the dataset, say so clearly instead of returning `None`.
- [ ] **Stop partial matches picking the wrong drug.** Searches use a partial `ilike` match and take the first row, so a short or misspelled name can match a different drug. Match exact names first, and offer "Did you mean…?" suggestions otherwise.

## 2. Make the README match the project

- [x] Add a `LICENSE` file (MIT).
- [x] Add `.env.example`.
- [ ] Add a database setup guide: the table schema plus a script that loads the DDInter data into Supabase, so anyone can run MediMatch locally.
- [ ] Replace the placeholder screenshots with real ones.
- [x] Fix the broken "Live Demo" link at the bottom of the README.
- [x] Remove claims that aren't built yet (fuzzy search, WCAG compliance, GitHub Actions CI) and the "AI-Powered" wording on the page.

## 3. Tests and CI

- [ ] Add Vitest and unit tests for the API route: name normalisation, severity mapping, both orders of a drug pair, missing input, and database errors.
- [ ] Add component tests for the search form and result card.
- [ ] Add a GitHub Actions workflow that runs lint, type-check, tests and build on every push and pull request.

## 4. Features

- [ ] **Autocomplete** drug names from the dataset, so users pick real names instead of typing them.
- [ ] **Check three or more drugs at once**, testing every pair and showing the most severe result first.
- [ ] **Brand-name lookup** (e.g. Nurofen → ibuprofen).
- [ ] **Shareable result links and a printable summary**, generated from the URL only, with nothing stored on the server.
- [ ] **Accessibility pass**: keyboard navigation, screen-reader labels, colour contrast, and severity shown with text and icons, not colour alone.

## 5. Tidy-up

- [ ] Remove the unused shadcn/ui components (about 30 of the 48 are never imported).
- [ ] Split the 650-line `src/app/page.tsx` into smaller components.
- [ ] Update Next.js and other dependencies, and keep them updated with Dependabot.

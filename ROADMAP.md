# MediMatch Roadmap

MediMatch is a drug–drug interaction lookup built on the public DDInter dataset, bundled with the app (no database). It stores no user data: no accounts, no saved searches, no patient records. Everything below keeps it that way.

## Where this is heading

Big free interaction checkers already exist. MediMatch's aim is narrower: **the simplest trustworthy way for a carer to check a whole list of someone's medicines**, and take the answer to a pharmacist or GP.

That means four things, in this order:

1. **Trustworthy.** It never says "no interaction" when it doesn't actually know. Every result shows where it came from (the dataset and its version).
2. **Built for medicine lists.** Check every pair in a list of medicines at once, using generic or UK brand names, with results in plain English.
3. **Easy to take to an appointment.** A clear printable or shareable summary, with questions to ask the pharmacist.
4. **Private by design.** No accounts, no tracking, nothing stored. A shared result lives only in its link.

Before promoting MediMatch more widely:

- [x] Check the DDInter data licence and show the required credit in the app (CC BY-NC-SA 4.0).
- [ ] Show the data source and version on every result.

## The plan

Items are in priority order. Each one has (or will have) a matching GitHub issue.

## 1. Safety fixes

These come first, because a drug checker must never look "safe" when it doesn't actually know.

- [x] **Treat lookup failures as errors, not "no interaction".** A failed lookup used to come back as severity `None`, which the page showed as safe. It now returns an error and the page says "We couldn't check this pair. Please try again."
- [x] **Separate "no known interaction" from "drug not in our data".** If either drug isn't in the dataset, say so clearly instead of returning `None`.
- [x] **Show "severity unknown" instead of "no interaction".** About a fifth of DDInter's pairs are recorded without a severity grade; these used to show as no interaction.
- [x] **Stop partial matches picking the wrong drug.** Searches use a partial `ilike` match and take the first row, so a short or misspelled name can match a different drug. Match exact names first, and offer "Did you mean…?" suggestions otherwise.

## 2. Make the README match the project

- [x] Add a `LICENSE` file (MIT).
- [x] Drop the database: the DDInter data ships with the app (`src/data/interactions.json`, built by `scripts/build-interactions.mjs`), so anyone can clone and run it with no setup.
- [ ] Replace the placeholder screenshots with real ones.
- [x] Fix the broken "Live Demo" link at the bottom of the README.
- [x] Remove claims that aren't built yet (fuzzy search, WCAG compliance, GitHub Actions CI) and the "AI-Powered" wording on the page.

## 3. Tests and CI

- [ ] Add Vitest and unit tests for the API route: name normalisation, severity mapping, both orders of a drug pair, missing input, and database errors.
- [ ] Add component tests for the search form and result card.
- [ ] Add a GitHub Actions workflow that runs lint, type-check, tests and build on every push and pull request.

## 4. Features

- [ ] **Press Enter to check**: submitting the form with the Enter key, not only the button.
- [ ] **Autocomplete** drug names from the dataset, so users pick real names instead of typing them.
- [ ] **Check three or more drugs at once**, testing every pair and showing the most severe result first.
- [ ] **Brand-name lookup** (e.g. Nurofen → ibuprofen).
- [ ] **Shareable result links and a printable summary**, generated from the URL only, with nothing stored on the server.
- [ ] **Accessibility pass**: keyboard navigation, screen-reader labels, colour contrast, and severity shown with text and icons, not colour alone.

## 5. Tidy-up

- [ ] Remove the unused shadcn/ui components (about 30 of the 48 are never imported).
- [ ] Split the 650-line `src/app/page.tsx` into smaller components.
- [ ] Update Next.js and other dependencies, and keep them updated with Dependabot.

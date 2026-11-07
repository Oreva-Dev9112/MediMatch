# MediMatch

A web app for checking whether two medicines interact. Type in two drug names and MediMatch looks them up in the public [DDInter](https://ddinter.scbdd.com/) drug–drug interaction dataset, then shows the severity (major, moderate, minor, or recorded but ungraded) with a short explanation and colour-coded guidance. Everyday UK names like paracetamol and aspirin work too.

**Live demo:** https://medi-match-two.vercel.app/

> **Medical disclaimer:** MediMatch is for information and learning only. It is not medical advice and may be incomplete or out of date. Always check with a pharmacist or doctor before changing any medication.

## Who it's for

People who want a quick, plain-English answer to "is it safe to take these two together?", such as patients, carers and students, before they speak to a pharmacist or doctor.

MediMatch has no accounts and stores nothing about the people who use it. Each search is a one-off lookup against public reference data.

## How it works

1. The page sends the two drug names to a Next.js API route (`src/app/api/drug-interaction/route.ts`).
2. The route finds each medicine by its exact name, or by an everyday name (paracetamol is filed as acetaminophen). There are no partial matches, so a typo can't land on the wrong drug; instead you get "did you mean…?" suggestions.
3. It looks the pair up in the DDInter data bundled with the app (`src/data/interactions.json`, about 160,000 pairs across 1,939 medicines), held in memory on the server. There's no database.
4. It answers one of four ways: an interaction and its severity, an interaction whose severity DDInter hasn't graded, no interaction recorded, or "we don't have that medicine".
5. The page shows the result as a colour-coded card with guidance for that answer.

## Built with

- **Next.js 15** (App Router) and **React 19**
- **TypeScript**
- **Tailwind CSS 4**, **shadcn/ui** components and **Framer Motion** for animation
- The DDInter data, bundled as a JSON file (no database)
- **Vercel** for hosting
- Data: the **DDInter** drug–drug interaction dataset

## Running it locally

You'll need Node.js 18.18 or newer. No accounts, keys or database are needed.

```bash
# 1. Get the code
git clone https://github.com/Oreva-Dev9112/MediMatch
cd MediMatch

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open http://localhost:3000.

### The data

`src/data/interactions.json` is built from DDInter's CSV downloads by a script:

```bash
node scripts/build-interactions.mjs path/to/ddinter_downloads_*.csv
```

It reads DDInter's own columns (`Drug_A`, `Drug_B`, `Level`), drops duplicate pairs, and writes a compact file of drug names and pairs. The current file was built from the DDInter downloads in July 2025. The data has its own licence; see [Data credit](#data-credit).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

## Roadmap

MediMatch works, but there's plenty still to do. In short:

1. **Safety fixes first:** make sure a database error or an unknown drug is never shown as "no interaction", and stop partial name matches picking the wrong drug ([#3](https://github.com/Oreva-Dev9112/MediMatch/issues/3), [#4](https://github.com/Oreva-Dev9112/MediMatch/issues/4), [#5](https://github.com/Oreva-Dev9112/MediMatch/issues/5)).
2. **Easier setup:** a database schema and DDInter import script, plus real screenshots.
3. **Tests and CI:** Vitest tests for the API and a GitHub Actions workflow.
4. **New features:** drug-name autocomplete, checking three or more medicines at once, brand-name lookup, and an accessibility pass.
5. **Tidy-up:** remove unused components and split up the main page.

The full plan is in [ROADMAP.md](ROADMAP.md), and each item is tracked in [the issues](https://github.com/Oreva-Dev9112/MediMatch/issues).

## Contributing

Bug reports and suggestions are welcome. Please [open an issue](https://github.com/Oreva-Dev9112/MediMatch/issues).

## Licence

Code: [MIT](LICENSE). The interaction data in `src/data/` is not MIT: it's derived from DDInter and licensed CC BY-NC-SA 4.0 (see [src/data/LICENSE.md](src/data/LICENSE.md)).

## Data credit

Interaction data comes from **DDInter**, by Xiong G. et al., *DDInter: an online drug–drug interaction database towards improving clinical decision-making and patient safety*, Nucleic Acids Research 50, D1200–D1207 (2022), [doi:10.1093/nar/gkab880](https://doi.org/10.1093/nar/gkab880).

DDInter's [terms](https://ddinter.scbdd.com/terms/) license its data under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/): non-commercial use, with credit, and shared under the same licence. MediMatch is free and non-commercial, credits DDInter on every page, and shares its copy of the data (`src/data/interactions.json`) under the same licence.

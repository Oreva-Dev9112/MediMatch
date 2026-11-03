# MediMatch

A web app for checking whether two medicines interact. Type in two drug names and MediMatch looks them up in the public [DDInter](https://ddinter.scbdd.com/) drug–drug interaction dataset, then shows the severity (major, moderate or minor) with a short explanation and colour-coded guidance.

**Live demo:** https://medi-match-two.vercel.app/

> **Medical disclaimer:** MediMatch is for information and learning only. It is not medical advice and may be incomplete or out of date. Always check with a pharmacist or doctor before changing any medication.

## Who it's for

People who want a quick, plain-English answer to "is it safe to take these two together?", such as patients, carers and students, before they speak to a pharmacist or doctor.

MediMatch has no accounts and stores nothing about the people who use it. Each search is a one-off lookup against public reference data.

## How it works

1. The page sends the two drug names to a Next.js API route (`src/app/api/drug-interaction/route.ts`).
2. The route lower-cases and trims the names, then searches the interactions table in Supabase in both orders (A + B and B + A).
3. It returns the severity and description in one consistent shape, whichever column layout the table uses.
4. The page shows the result as a colour-coded card with guidance for that severity.

## Built with

- **Next.js 15** (App Router) and **React 19**
- **TypeScript**
- **Tailwind CSS 4**, **shadcn/ui** components and **Framer Motion** for animation
- **Supabase** (PostgreSQL) for the interaction data
- **Vercel** for hosting
- Data: the **DDInter** drug–drug interaction dataset

## Running it locally

You'll need Node.js 18.18 or newer and a free [Supabase](https://supabase.com/) project.

```bash
# 1. Get the code
git clone https://github.com/Oreva-Dev9112/MediMatch
cd MediMatch

# 2. Install dependencies
npm install

# 3. Add your Supabase settings
cp .env.example .env.local
# then edit .env.local with your project URL and keys

# 4. Start the dev server
npm run dev
```

Then open http://localhost:3000.

### Database

The app reads from a table called `drug_interactions` (you can change the name with `NEXT_PUBLIC_DRUG_INTERACTIONS_TABLE`). It accepts either of these column layouts:

| Layout | Columns |
|---|---|
| DDInter-style | `primary_drug_name`, `secondary_drug_name`, `interaction_severity`, `description` |
| Simple | `drug1`, `drug2`, `severity`, `description` |

A SQL schema and an import script for the DDInter files are planned ([#6](https://github.com/Oreva-Dev9112/MediMatch/issues/6)). Until then, create the table in Supabase and import the DDInter CSV files with the Supabase table editor.

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

Code: [MIT](LICENSE).

The DDInter data is not part of this repository and has its own terms. Check the [DDInter website](https://ddinter.scbdd.com/) before reusing it.

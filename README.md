# JSTests

A proctored JavaScript assessment. Candidates sign in, take an exam drawn at random from a question bank, and earn a certificate with a QR code that anyone can verify.

- **Easy:** choose the correct option (multiple choice).
- **Medium:** type the exact printed output.
- **Hard:** write a function in a live editor, graded by hidden tests that run in an isolated sandbox.

The interface is English only. This is a portfolio project: clean architecture and a polished UI, not production hardening. Read [Known issues](#known-issues) before publishing it anywhere public.

**Stack:** React 18, Vite 5, TypeScript (strict), React Router 6, Firebase 10 (Auth + Firestore), GSAP, `qrcode`, `jspdf`, Vitest. Plain CSS variables for theming (light default, dark optional). A separate Cloud Functions package in `functions/` (Node 20, `firebase-functions` v6, `firebase-admin` v12).

---

## Contents

1. [Quick start](#quick-start)
2. [Environment variables](#environment-variables)
3. [Firebase setup](#firebase-setup)
4. [Cloud Functions (server)](#cloud-functions-server)
5. [Deploy to Vercel](#deploy-to-vercel)
6. [Question bank](#question-bank)
7. [How an exam works](#how-an-exam-works)
8. [Exam mode (proctoring)](#exam-mode-proctoring)
9. [Certificates and verification](#certificates-and-verification)
10. [SEO and sharing](#seo-and-sharing)
11. [Scripts](#scripts)
12. [Project structure](#project-structure)
13. [Security and threat model](#security-and-threat-model)
14. [Known issues](#known-issues)

---

## Quick start

Requirements: Node 20 or newer, npm, and a Firebase project (see [Firebase setup](#firebase-setup)).

```bash
npm install
cp .env.example .env     # then fill in your Firebase web config and VITE_SITE_URL
npm run dev              # http://localhost:5173
```

Other commands:

```bash
npm test                 # 197 unit tests (root package)
npm run typecheck        # tsc --noEmit
npm run build            # typecheck, generate robots.txt and sitemap.xml, production build to dist/
npm run preview          # serve the built dist/ locally
```

To run the server tests too:

```bash
cd functions && npm install && npm test     # 143 tests
```

If the page is blank, check the terminal running `npm run dev` and the browser console. A compile error in one of them is the usual cause.

---

## Environment variables

Vite reads these at build time from `.env` (local) or from the host's environment settings (Vercel). Keys starting with `VITE_` are embedded in the JavaScript bundle, so they are public by design. Firebase web config is not a secret; the security comes from Firestore rules and Auth.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | yes | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | yes | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | yes | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | yes | Firebase web app ID |
| `VITE_SITE_URL` | yes for deploy | Public URL of the site, no trailing slash. Used for QR codes, canonical links, Open Graph tags, `sitemap.xml` and `robots.txt`. `.env.example` uses the placeholder `https://your-domain.example`. |

`.env` is gitignored. Never commit it. Copy `.env.example` as the template.

---

## Firebase setup

1. **Create a project** in the [Firebase console](https://console.firebase.google.com) and add a **Web app**. Copy its config into `.env`.
2. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
3. **Authentication → Settings → Authorized domains:** add every domain the site runs on (your Vercel domain, e.g. `your-app.vercel.app`, and any custom domain). `localhost` is already listed. Google sign-in fails on unlisted domains.
4. **Firestore Database:** create it, then deploy the rules and indexes:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```

   `npx` runs the Firebase CLI on demand, so no global install is needed. `firebase.json` and `.firebaserc` are already in the repo. `.firebaserc` points at project `js-test-282a9`; change it to your project ID.

   `firestore.indexes.json` defines the composite index `questions: level + rand`, which makes random sampling cheap. The app still works without it, but reads more documents. If the browser shows an index error, follow the link it prints.

5. **Set the admin.** The admin is one specific account: a **verified** email. It is hard-coded in three places, and all three must match:
   - `firestore.rules` (the real gate, `isAdmin()`)
   - `src/lib/admin.ts` (UI check)
   - `functions/src/config.ts` (`ADMIN_EMAIL`, server check)

   Sign up with that address, verify it, then sign in. The admin sees **/admin**.

6. **Load questions.** As the admin, open **/admin → Questions** and import your question JSON (see [Question bank](#question-bank)). An empty bank means an empty exam. The starter set is not shipped to the browser, so there is no one-click upload.

### Plan requirements

- **Auth and Firestore** work on the free Spark plan within its quotas.
- **Cloud Functions** (the `functions/` package) need the **Blaze** (pay-as-you-go) plan and a linked billing account. The `CERT_SIGNING_KEY` secret is stored in Secret Manager, which is also part of Blaze. Blaze has free monthly quotas, so a small exam site normally pays nothing, but you must add a card. Check current pricing on the Firebase site before enabling it.
- The current browser app does not call Cloud Functions yet. Until it does, Blaze is not needed for the site to run. See [Known issues](#known-issues).

---

## Cloud Functions (server)

The `functions/` package is the server side: exam drawing and grading, certificate signing and verification, and admin bank writes. It writes with the Admin SDK, which bypasses the client rules.

Callables exported from `functions/src/index.ts`:

| Function | Who | What |
| --- | --- | --- |
| `startExam` | signed-in user | Draws an exam. Answer keys stay on the server. |
| `finishExam` | signed-in user | Grades submitted answers and runs hidden tests. Issues a certificate on a pass. |
| `checkCertificate` | anyone | Verifies a certificate ID and returns only the fields a verifier needs. |
| `adminBankCall` | admin | Bank CRUD, bulk upload, and the starter set. |
| `demoQuestion`, `demoAnswer` | anyone | Demo questions for the landing page. |

Setup and deploy:

```bash
cd functions
npm install
cd ..
npx firebase-tools functions:secrets:set CERT_SIGNING_KEY    # paste a long random string
```

Deploy:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,functions
```

Before the first functions deploy, `firebase.json` needs a functions entry. It is not in the repo yet, so add this inside the top-level object:

```json
"functions": { "source": "functions" }
```

Rotate `CERT_SIGNING_KEY` only with a plan: certificates signed with the old key stop verifying.

Sandbox note: hidden tests run in a child process per test (`functions/src/sandbox/`) with a 3 second kill and an empty environment. A child process is **not** a security boundary; see [Security and threat model](#security-and-threat-model).

Full details: [`functions/README.md`](functions/README.md).

---

## Deploy to Vercel

The site is a static single-page app. Vercel only hosts the front end. The Firebase functions deploy separately with the Firebase CLI.

1. **Push the repo to GitHub.** `.env`, `node_modules`, `dist`, and `functions/lib` are gitignored and must stay out.
2. **Import the repo** in Vercel. Settings:
   - **Framework preset:** Vite (auto-detected)
   - **Install command:** `npm install`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Node.js version:** 20 or newer
3. **Add environment variables** (Project → Settings → Environment Variables), for Production and Preview:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_SITE_URL`, set to your real domain, e.g. `https://your-app.vercel.app`

   `VITE_*` values are baked in at build time. After changing one, redeploy.
4. **Authorize the domain** in Firebase Auth (see step 3 of [Firebase setup](#firebase-setup)).
5. **Deploy.** The `prebuild` step writes `robots.txt` and `sitemap.xml` for `VITE_SITE_URL`.

`vercel.json` rewrites every path to `index.html`, so deep links such as `/certificate/<id>` load the app instead of returning 404.

The repo's `public/robots.txt` and `public/sitemap.xml` were generated for `http://localhost:5173`. Every build regenerates them from `VITE_SITE_URL`, so the production values come from the Vercel environment.

---

## Question bank

Exams read only from the Firestore `questions` collection. There is no fallback. The browser bundle contains no question bank: the landing preview uses four demo questions in `src/data/heroQuestions.ts`, written for that page. The admin imports questions from a JSON file (below). The starter bank in `src/data/seed/` is TypeScript used by the tests and by the server copy in `functions/src/seed/`; it is not uploaded from the browser.

**Admin → Questions** has one tab per level:

- **Add, edit, delete** a question or task. Delete asks for confirmation. Lists load 25 at a time.
- **Easy:** prompt, code snippet, four options, the correct option, explanation.
- **Medium:** prompt, snippet, accepted answers (one per line; spaces and quotes are ignored when comparing), hint, explanation.
- **Hard:** title, function name, description, requirements, starter code, visible tests, hidden tests. Each test has a name, a JavaScript `call` expression and an `expect` expression. `sleep(ms)` is available for async checks.
- **Import from JSON:** an array of items in the same shape, for loading many at once. Invalid rows are skipped and counted.

Example import file:

```json
[
  { "id": "e-demo1", "level": "easy", "topic": "basics", "prompt": "What does this print?", "snippet": "console.log(typeof [])", "options": ["\"array\"", "\"object\"", "\"list\"", "\"undefined\""], "correct": 1, "explanation": "Arrays are objects." },
  { "id": "m-demo1", "level": "medium", "topic": "coercion", "prompt": "Type exactly what is printed.", "snippet": "console.log(1 + '2')", "accept": ["12"], "hint": "One value.", "explanation": "+ concatenates with a string." }
]
```

Topics are `basics`, `arrays`, `functions`, `coercion`, `closures` and `async` (see `src/data/types.ts`).

---

## How an exam works

Settings live in `src/data/tests.ts`:

- **Picks per level:** `PICKS_PER_LEVEL`. Currently 15 easy, 15 medium, 4 hard. A level with fewer items contributes what it has.
- **Time per item:** `SECONDS_PER_ITEM`. Currently 40 s easy, 75 s medium, 480 s hard. The exam clock is the sum over the drawn items, so the full test is about 61 minutes (32 of them on the four hard tasks).
- **Tests:** the list of tests a candidate can pick (e.g. the full assessment, or a topic-specific one). A test can filter by topic.

Items are drawn at random (`src/lib/exam.ts`). Easy options are shuffled.

**Scoring:**

- One point per easy or medium question.
- A hard task earns the fraction of its hidden tests that pass.
- Score = points ÷ items, as a percentage.

**Pass rule:** the overall score must be at least **70%** (`PASS_THRESHOLD` in `src/lib/grading.ts`). The server rule in `functions/src/config/pass-rule.json` also requires **50% on each level** the test uses, so a strong easy and medium score cannot hide a zero on hard. The browser checks only the overall score today. See [Known issues](#known-issues).

---

## Exam mode (proctoring)

Once the candidate ticks the acknowledgement and presses Start:

- Full screen is requested. The **Keyboard Lock API** captures Esc, F11 and a few others where the browser supports it (Chromium).
- **Blocked:** F5, Ctrl/Cmd+R, S, P, Alt+arrows, PrintScreen (which also clears the clipboard), right click, copy, cut, drag and drop, pasting into the editor, text selection, printing, the Back button. Closing the tab prompts for confirmation.
- **Detected, one strike each:** leaving full screen, switching tab or window, developer tools shortcuts (F12, Ctrl+Shift+I/J/C, Cmd+Opt+I/J/C, Ctrl+U), and DevTools being open (a window-size gap, plus a `debugger` timing probe that catches undocked panels).
- **Three strikes** end the exam. It is graded on what was completed, marked terminated, and gets no certificate.
- **Refresh and close:** reloading or closing mid-exam leaves a marker in `localStorage`. The next visit records a failed, terminated attempt, so a refresh cannot re-roll the questions.
- **Blocked starts:** more than one display (`screen.isExtended`) or no fullscreen support.
- **Timer:** uses the wall clock, so a throttled tab cannot slow it. At zero the exam is submitted with whatever was answered.
- **No feedback during the exam.** Choices are recorded without a correct or incorrect signal. Answers and explanations appear in the review on the results page. A terminated attempt gets no review.
- **Admin view:** strikes and reasons are saved on the attempt and shown in **Attempts**.

**What no web page can stop:** screenshots, a phone pointing at the screen, a second computer, a virtual machine, a remote desktop, OS-level shortcuts the browser never receives, or a determined user editing the page's JavaScript. This mode deters and detects. For real proctoring, use a secure browser or a human or camera-based service.

---

## Certificates and verification

On a pass, a certificate is issued with an ID like `JST-XXXX-XXXX-XXXX`. Its document records the holder, test, score, per-level breakdown and issue date.

- **Certificate view** (`src/components/CertificateView.tsx`) shows the score against the pass mark, points per level, issue date, ID and a **QR code** (`src/components/QrCode.tsx`). The QR encodes `VITE_SITE_URL/certificate/<id>`.
- **`/certificate/:id`** is public and shows the stored record. **`/certificate/sample`** previews the design; it has no download.
- **`/verify`** accepts an ID or a pasted link (`extractCertId` in `src/lib/certificate.ts`). The landing page has the same box.
- **PDF download:** the certificate page and results screen have a "Download PDF" button. The PDF is built in the browser with `jspdf` (`src/lib/certificatePdf.ts`), using the Bricolage fonts in `public/fonts/`. It is not signed. A verifier still checks the ID against the database.

---

## SEO and sharing

- `src/lib/seo.ts` (`usePageMeta`) sets title, description, canonical, Open Graph and Twitter tags per page. Private pages are `noindex`.
- `index.html` holds the defaults, JSON-LD (`WebApplication`) and all favicons. `%VITE_SITE_URL%` is filled from the environment at build time.
- `public/` contains `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png` (1200×630), `logo.svg`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml` and `fonts/`.
- `npm run assets` regenerates the icons, logo and share image. It needs Python 3 with Pillow.
- The site is a client-rendered SPA. Google renders it, but link-preview bots (LinkedIn, Slack, WhatsApp) read only the static `index.html`, so every page shares the default preview. Per-certificate previews would need server rendering or an edge function.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | `prebuild` writes `robots.txt` and `sitemap.xml`, then `tsc --noEmit`, then `vite build` |
| `npm run preview` | Serves the production build locally |
| `npm run typecheck` | Type checks `src/` and `vite.config.ts` |
| `npm test` | Runs the root Vitest suite |
| `npm run assets` | Regenerates logo, icons and share image (needs Python 3 and Pillow) |

The `functions/` package has `build`, `typecheck` and `test` scripts. Run them from inside `functions/`.

---

## Project structure

```
src/
  App.tsx, main.tsx              routes (lazy-loaded pages, guards)
  context/                       AuthContext (provider and context object)
  hooks/                         useAuth, useTestSession, useExamLock, useCountdown, useSandbox,
                                 useCodeEditor, useQuizKeys, useAttempts, useAbandonedExam,
                                 useOnlineStatus, useTheme
  lib/
    db.ts                        Firestore access for the browser (bank, attempts, certificates, users)
    firebase.ts                  Firebase app initialization
    bank.ts, exam.ts             bank parsing and validation, random draw, answer normalizing
    grading.ts, finishTest.ts    scoring, hidden-test results, saving a finished test
    examGuard.ts, examMarker.ts  exam-mode rules (pure, tested) and the abandoned-exam marker
    questionDraft.ts             admin question form model and validation
    certificate.ts, certificatePdf.ts, seo.ts, motion.ts (GSAP), validation.ts, authErrors.ts, ...
    sandbox/                     runner (runs inside the sandbox), execute (iframe + timeout), parse
  data/                          types.ts, tests.ts (tests, picks, seconds), heroQuestions.ts (landing demo),
                                 seed/ (starter bank, used by tests only)
  components/                    CertificateView, QrCode, SiteHeader, ExamRules, VerifyBox, ...
    admin/                       AdminAttempts, AdminUsers, questions/ (question CRUD)
    auth/                        AuthForm, AuthField, PasswordRules
    dashboard/                   AttemptsTable, TestRow, VerifyBanner
    landing/                     HeroQuestion, Stages, Faq, CertificateSection, ...
    test/                        ExamShell, CodingSection, QuizSection, TypedSection, ResultScreen, ...
  pages/                         Landing, Login, Verify, Certificate, Dashboard, Test, Admin, NotFound, Offline
  styles/                        tokens.css (themes), base.css, components.css, landing.css
functions/
  src/index.ts                   callable entry points
  src/exam.ts                    draws and grades exams; stores answer keys server-side
  src/sandbox/                   host (fork per test), worker (child process), runner
  src/certificate.ts, certificates.ts   IDs and HMAC signatures; issue and verify
  src/bank.ts, admin.ts          question bank (public questions vs secret answer keys)
  src/config/                    pass-rule.json and tests.json (shared numbers)
  src/seed/                      server copy of the starter bank
scripts/                         make-seo.mjs (sitemap and robots), make-logo.mjs, make-images.py, make-og.mjs
firestore.rules, firestore.indexes.json, firebase.json, .firebaserc
vercel.json                      SPA rewrite to index.html
PRODUCT.md, DESIGN.md            product and design notes
```

---

## Design

Light-first and calm (see `DESIGN.md`): warm paper background, white surfaces, hairline borders, one ink-blue accent. Text uses League Spartan (headings) and Figtree (body), loaded from Google Fonts. Code, timers and keycaps use JetBrains Mono. Dark is a secondary theme, switchable from the header. Motion is limited to short entrances and the landing demo, and is skipped under `prefers-reduced-motion`. Layout works down to 360 px wide.

---

## Security and threat model

- **User code** runs in an `<iframe sandbox="allow-scripts">` without `allow-same-origin`, injected via `srcdoc`, inside a Web Worker. It cannot reach the app's cookies, storage, DOM or Firebase session. A 3-second timeout removes the iframe and reports an infinite loop. Results return by `postMessage` and are validated in `src/lib/sandbox/parse.ts`. The code can still use the network and can post forged results.
- **Server-side hidden tests** (`functions/src/sandbox/`) run each test in a child process with a 3-second kill and an empty environment. A child process is not a security boundary: code in it can still reach the filesystem and network the function can. Before running untrusted code for real users, move `runIsolatedTest` into a container with no network and no credentials, keeping the same payload protocol.
- **Firestore rules:**
  - Users read and write only their own attempts.
  - Certificates are readable by ID and immutable.
  - Listing users, attempts and certificates, and writing the question bank, are admin-only.
  - Any signed-in user can read the `questions` collection. The rules file notes that readers receive the answers and hidden tests of the questions they draw.
- **Grading in the browser today.** Anyone with devtools can read what they drew, tamper with a score, or write a certificate document directly, because the current client grades and writes results itself. The intended design, in `functions/`, moves drawing, grading and certificate issuing to Cloud Functions with the Admin SDK, and disables client writes to `attempts` and `certificates`. The browser app has not been switched over to it yet.

---

## Known issues

These are the gaps between the design and the code today. Fix them before a public launch.

1. **Answers are readable from Firestore.** The browser bundle no longer contains the question bank. Any signed-in user can still read the `questions` collection, though, and that includes the answers and hidden tests. Closing this needs the server to serve questions and grade (see [Cloud Functions](#cloud-functions-server), which needs Blaze).
2. **The repo exposes the bank.** `src/data/seed/` and `functions/src/seed/` hold every starter answer and hidden test as source. A public GitHub repo publishes them. Keep the repo private, or remove the seed folders before publishing, while the bank comes from your own uploads.
3. **The browser does not use the server yet.** `startExam`, `finishExam` and `checkCertificate` exist and are tested, but no file in `src/` calls them. The client still draws, grades and writes on its own.
4. **Per-level pass rule is server-only.** `functions/src/config/pass-rule.json` requires 50% per level. The browser's `PASS_THRESHOLD` checks only the 70% overall score, so a candidate can pass in the browser with a zero on hard.
5. **`firebase.json` has no `functions` entry**, so `firebase deploy --only functions` will not run until one is added (see [Cloud Functions](#cloud-functions-server)).
6. **Forgeable results and certificates** while grading stays in the browser (see the threat model).
7. **Random sampling** by the stored `rand` field is approximately uniform, not perfectly uniform.
8. **Topic-filtered tests** read up to 120 documents per level (`POOL_LIMIT` in `src/lib/db.ts`) before sampling.
9. **Password policy** is enforced only by the client rules. For server-enforced rules, configure a password policy in Firebase Auth.
10. **Admin email in source.** The admin address appears in `firestore.rules`, `src/lib/admin.ts` and `functions/src/config.ts`. A public repo exposes it.

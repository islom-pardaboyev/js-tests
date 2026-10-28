# JSTests server (Cloud Functions)

Grading, certificates and the question bank run here. The browser never writes
results, certificates, questions or answer keys; see `firestore.rules`.

## Layout

- `src/index.ts`: the callable entry points (`startExam`, `finishExam`, `checkCertificate`, `adminBankCall`, `demoQuestion`, `demoAnswer`).
- `src/exam.ts`: draws an exam, stores its answer key in `examSessions`, grades submissions.
- `src/sandbox/`: runs hidden tests, one child process per test, with a 3 second kill and no environment variables.
- `src/passRule.ts` + `src/config/pass-rule.json`: the pass rule (70% overall, 50% per level).
- `src/normalize.ts`: how typed (medium) answers are compared; the rules are documented there.
- `src/certificate.ts` + `src/certificates.ts`: 16-character IDs and HMAC signatures.
- `src/bank.ts`: the question bank, split into `questions` (public) and `answerKeys` (secret).

## One-time setup

```bash
cd functions && npm install
firebase functions:secrets:set CERT_SIGNING_KEY   # paste a long random string
```

## Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes,functions
```

After deploying, sign in as the admin and press **Move answers to the server (once)**
in the Questions tab. Until you do, existing questions have no answer keys and
exams will draw no items.

## Known limits (read before relying on this)

- A child process is not a security boundary. For real candidates' code, run
  `runIsolatedTest` inside a container with no network and no credentials
  (for example Cloud Run with gVisor), keeping the same payload.
- The deadline check happens at submit time. The server cannot know when each
  answer was typed; the grace period is `SUBMIT_GRACE_MS` in `src/config.ts`.
- Browser checks (full screen, strikes, DevTools detection) deter cheating; they
  are not a guarantee. Results are reliable because grading is server-side.
- `checkCertificate` has no rate limit yet.

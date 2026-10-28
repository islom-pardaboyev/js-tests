# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
React 18 + Vite + TypeScript + TailwindCSS, React Router, Firebase v10 (Auth + Firestore), GSAP for motion. Plain CSS variables for theming (dark default, light optional). No UI component library. User-specified.

## Users
Junior to mid JavaScript developers in Uzbekistan who want to prove their skills and share a verifiable certificate on a CV or LinkedIn. Employers there expect developers to work in English, so the whole interface is English. One admin (ipardaboyev574@gmail.com) reviews users and results.

## Product Purpose
JSTests is a JavaScript assessment platform. A test draws 15 easy, 15 medium and 4 hard questions at random out of a question bank: easy (ABCD), medium (type the exact output), hard (write a function in the live editor). Pass at 70% combined earns a certificate with a public verification link. Portfolio demo: clean architecture and a polished UI over production hardening.

## Positioning
Questions test predicting and writing real code (coercion, closures, event loop), in a sandboxed in-browser editor, under a proctored full-screen exam mode, with public certificate verification. The UI is honest about what runs on the client and what a browser can and cannot enforce.

## Operating Context
Interface text is English only. Code, identifiers and snippets are English. Question bank lives in Firestore (easy/medium/hard, any size) with a bundled seed fallback. Grading runs client-side in this demo; production would move grading, question serving and certificate issuance to a Cloud Function.

## Capabilities and Constraints
- Auth: email/password, Google, sign-out, email verification banner, password requirements shown live on sign-up.
- Tests: JavaScript Assessment (all topics) plus topic tracks: Basics, Coercion & Equality, Closures & Scope, Async & the Event Loop, Coding Challenges.
- Exam mode once started: full screen, Esc locked where the browser allows, shortcut and DevTools blocking and detection, tab-switch detection, strikes then auto-termination. A browser cannot enforce this fully; the UI says so.
- User code runs in a sandboxed iframe (allow-scripts only), 3 s timeout.
- Admin panel limited to the verified email ipardaboyev574@gmail.com, enforced in Firestore rules. Admin can view users, attempts and the question bank (seed, JSON import).
- No automatic PDF certificate: the owner produces PDFs by hand.
- No git init, no commits.

## Brand Commitments
Name JSTests. Logo is a custom SVG: a terminal prompt with a cursor and two dots, on a dark rounded tile. No pink anywhere (user rejected it).

## Evidence on Hand
No testimonials, customers or metrics exist; none may be invented.

## Product Principles
1. Honest about the client: say what runs in the browser and what the exam mode cannot guarantee.
2. Prediction and writing over trivia.
3. A certificate must be verifiable by anyone without logging in.
4. English first; code stays English.

## Accessibility & Inclusion
Responsive to 360px, respects prefers-reduced-motion (GSAP motion is disabled or reduced), keyboard shortcuts for easy questions.

/**
 * The log lines each loading state prints. Written the way the code actually
 * runs (Firestore queries, sandboxes, rules, grading), so the people who
 * recognise them know exactly what is happening.
 */
export type LoaderScope = 'page' | 'bank' | 'grade' | 'cert' | 'attempts' | 'admin';

export const LOADER_LINES: Record<LoaderScope, string[]> = {
  page: [
    '$ jstests dev --open',
    'resolving modules .......................... ok',
    'onAuthStateChanged(cb) ..................... waiting',
    'hydrate AuthContext  user=null|User ........ ok',
    'lazy(() => import("./pages/*")) ............ ok',
  ],
  bank: [
    'GET /questions?level=easy&rand>=0.4213 ..... 200',
    'GET /questions?level=medium&rand>=0.8810 ... 200',
    'GET /questions?level=hard&rand>=0.1297 ..... 200',
    'shuffle(options) ........................... ok',
    'buildExam() -> 15 easy · 15 medium · 15 hard',
  ],
  grade: [
    'sandbox.spawn(iframe, "allow-scripts") ..... ok',
    'worker.postMessage(hiddenTests) ............ sent',
    'Promise.all(tasks) ......................... pending',
    'grade = points / total ..................... ok',
    'setDoc(attempts/{id}) ...................... pending',
    'createCertificate("JST-…") ................. pending',
  ],
  cert: [
    'GET /certificates/{id} ..................... 200',
    'rules: allow get: if true .................. ok',
    'JSON.parse(record) ......................... ok',
    'render <CertificateView/> .................. ok',
  ],
  attempts: [
    'query(attempts, where("uid", "==", uid)) ... ok',
    'orderBy(createdAt, "desc") ................. ok',
    'rows.map(toAttempt) ........................ ok',
  ],
  admin: [
    'GET /users?limit=500 ....................... 200',
    'GET /attempts?limit=500 .................... 200',
    'isAdmin(token.email_verified) .............. true',
    'render <AdminTables/> ...................... ok',
  ],
};

/** `[=====>      ] 42%`, drawn in plain text. */
export function progressBar(done: number, total: number, width = 18): string {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const filled = total === 0 ? 0 : Math.round((done / total) * width);
  const bar =
    filled >= width
      ? '='.repeat(width)
      : filled > 0
        ? '='.repeat(filled - 1) + '>' + ' '.repeat(width - filled)
        : ' '.repeat(width);
  return `[${bar}] ${pct}%`;
}

/** Splits a log line into its text and its trailing status (`200`, `ok`, `pending`…). */
export function splitStatus(line: string): { head: string; status: string | null } {
  const m = /^(.*\.{2,}\s*)(\S+)$/.exec(line);
  return m ? { head: m[1], status: m[2] } : { head: line, status: null };
}

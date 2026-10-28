/**
 * Marks an exam as in progress in localStorage. If the page is reloaded or
 * closed mid-exam, the next visit finds the marker and records the attempt as
 * abandoned (a failed, terminated attempt), so a refresh cannot be used to
 * re-roll the random questions.
 */
const KEY = 'jstests-exam-in-progress';

interface ExamMarker {
  uid: string;
  testId: string;
  startedAt: number;
}

export function setMarker(marker: ExamMarker): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(marker));
  } catch {
    /* storage may be blocked */
  }
}

export function readMarker(): ExamMarker | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<ExamMarker>;
    return typeof m.uid === 'string' && typeof m.testId === 'string' && typeof m.startedAt === 'number'
      ? { uid: m.uid, testId: m.testId, startedAt: m.startedAt }
      : null;
  } catch {
    return null;
  }
}

export function clearMarker(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

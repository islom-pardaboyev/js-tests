import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { recordAbandoned } from '../lib/finishTest';
import { clearMarker, readMarker } from '../lib/examMarker';

/**
 * If the last exam was left mid-way (page closed or reloaded), record it as a
 * failed attempt once, then tell the user. Returns the test id when that happened.
 */
export function useAbandonedExam(user: User | null, onRecorded: () => void): string | null {
  const [testId, setTestId] = useState<string | null>(null);
  useEffect(() => {
    const marker = readMarker();
    if (!user || !marker || marker.uid !== user.uid) return;
    clearMarker();
    recordAbandoned(user, marker.testId, marker.startedAt)
      .then(() => {
        setTestId(marker.testId);
        onRecorded();
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);
  return testId;
}

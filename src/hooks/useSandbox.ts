import { useCallback, useEffect, useRef, useState } from 'react';
import { executeInSandbox } from '../lib/sandbox/execute';
import { emptyResult, type SandboxResult, type SandboxTestInput } from '../lib/sandbox/types';

interface UseSandbox {
  result: SandboxResult | null;
  running: boolean;
  run: (code: string, fnName: string, tests: SandboxTestInput[]) => Promise<SandboxResult>;
  reset: () => void;
}

/** React wrapper around the iframe runner. User code never runs in this window. */
export function useSandbox(): UseSandbox {
  const [result, setResult] = useState<SandboxResult | null>(null);
  const [running, setRunning] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async (code: string, fnName: string, tests: SandboxTestInput[]) => {
    setRunning(true);
    setResult(emptyResult());
    const next = await executeInSandbox(code, fnName, tests);
    if (alive.current) {
      setResult(next);
      setRunning(false);
    }
    return next;
  }, []);

  const reset = useCallback(() => setResult(null), []);
  return { result, running, run, reset };
}

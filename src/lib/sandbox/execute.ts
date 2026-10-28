import { applyMessage, finalizeResult, parseSandboxMessage } from './parse';
import { createRunner, type RunPayload } from './runner';
import { emptyResult, type SandboxResult, type SandboxTestInput } from './types';

const SANDBOX_TIMEOUT_MS = 3000;
const TIMEOUT_MESSAGE = 'Infinite loop detected: the code ran for more than 3 seconds and was stopped.';

/** Source of the page loaded into the iframe (srcdoc). */
function buildSrcdoc(): string {
  const runnerSrc = createRunner.toString();
  const workerSrc =
    `const createRunner = ${runnerSrc};\n` +
    `const run = createRunner((m) => self.postMessage(m));\n` +
    `self.onmessage = (e) => { run(e.data); };`;
  const safe = (s: string) => JSON.stringify(s).replace(/</g, '\\u003c');
  return `<!doctype html><html><body><script>
const workerSrc = ${safe(workerSrc)};
const createRunner = ${runnerSrc.replace(/<\/script/gi, '<\\/script')};
const toParent = (m) => parent.postMessage(m, '*');
function runDirect(payload) { createRunner(toParent)(payload); }
function start(payload) {
  let received = false;
  try {
    const worker = new Worker(URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' })));
    worker.onmessage = (e) => { received = true; toParent(e.data); };
    worker.onerror = () => { if (!received) runDirect(payload); };
    worker.postMessage(payload);
  } catch (err) { runDirect(payload); }
}
addEventListener('message', (e) => {
  if (e.source === parent && e.data && e.data.type === 'run') start(e.data);
});
toParent({ source: 'jstests', type: 'ready' });
</script></body></html>`;
}

/**
 * Runs user code in a throwaway iframe: sandbox="allow-scripts" (no
 * allow-same-origin), srcdoc-injected. Results come back via postMessage.
 * After `timeoutMs` the iframe is removed from the DOM, which also kills the
 * worker the code runs in, and the run is reported as an infinite loop.
 */
export function executeInSandbox(
  code: string,
  fnName: string,
  tests: SandboxTestInput[],
  timeoutMs: number = SANDBOX_TIMEOUT_MS,
): Promise<SandboxResult> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none';
    let result = emptyResult();
    let settled = false;

    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      iframe.remove();
      const final = finalizeResult(result, tests, timedOut);
      resolve(timedOut ? { ...final, error: TIMEOUT_MESSAGE } : final);
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== iframe.contentWindow) return;
      const msg = parseSandboxMessage(event.data);
      if (!msg) return;
      if (msg.type === 'ready') {
        const payload: RunPayload = { type: 'run', code, fnName, tests };
        iframe.contentWindow?.postMessage(payload, '*');
      } else if (msg.type === 'done') {
        finish(false);
      } else {
        result = applyMessage(result, msg);
      }
    };

    const timer = setTimeout(() => finish(true), timeoutMs);
    window.addEventListener('message', onMessage);
    iframe.srcdoc = buildSrcdoc();
    document.body.appendChild(iframe);
  });
}

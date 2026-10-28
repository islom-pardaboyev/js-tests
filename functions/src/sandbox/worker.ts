/**
 * Child-process entry point. The host forks this file once per hidden test,
 * sends one payload, and reads one result back. It runs with an empty
 * environment (no Firebase or signing secrets), in a temp working directory,
 * and the host kills it after the per-test limit.
 */
import { runOne, type RunPayload } from './runner';

process.once('message', async (payload: RunPayload) => {
  const result = await runOne(payload);
  process.send?.(result, () => process.exit(0));
});

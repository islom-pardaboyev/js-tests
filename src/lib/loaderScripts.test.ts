import { describe, expect, it } from 'vitest';
import { LOADER_LINES, progressBar, splitStatus, type LoaderScope } from './loaderScripts';

describe('loader lines', () => {
  it('has a real log for every loading state', () => {
    for (const scope of Object.keys(LOADER_LINES) as LoaderScope[]) {
      expect(LOADER_LINES[scope].length).toBeGreaterThanOrEqual(3);
      expect(LOADER_LINES[scope].every((l) => l.trim().length > 0)).toBe(true);
    }
  });
});

describe('progressBar', () => {
  it('draws the bar and the percentage', () => {
    expect(progressBar(0, 4, 10)).toBe('[          ] 0%');
    expect(progressBar(2, 4, 10)).toBe('[====>     ] 50%');
    expect(progressBar(4, 4, 10)).toBe('[==========] 100%');
  });
  it('handles an empty log', () => {
    expect(progressBar(0, 0, 4)).toBe('[    ] 0%');
  });
});

describe('splitStatus', () => {
  it('separates the status from the log text', () => {
    expect(splitStatus('GET /x?y=1 ..... 200')).toEqual({ head: 'GET /x?y=1 ..... ', status: '200' });
    expect(splitStatus('rows.map(f) ........ ok')).toEqual({ head: 'rows.map(f) ........ ', status: 'ok' });
    expect(splitStatus('$ jstests dev --open')).toEqual({ head: '$ jstests dev --open', status: null });
  });
});

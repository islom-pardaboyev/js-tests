import { useEffect, useRef, useState } from 'react';
import { highlight } from '../../lib/highlight';
import { CheckIcon, CopyIcon } from '../Icons';

interface Props {
  code: string;
  /** Off during an exam: copying questions out is blocked. */
  copyable?: boolean;
}

export function CodeSnippet({ code, copyable = false }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: leave the button idle */
    }
  };

  return (
    <div className={`snippet ${copyable ? 'copyable' : ''}`}>
      <pre><code dangerouslySetInnerHTML={{ __html: highlight(code) }} /></pre>
      {copyable && (
        <>
          <button type="button" className="icon-btn copy" onClick={() => void copy()} aria-label="Copy code" title="Copy">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <span className="sr-only" role="status">{copied ? 'Copied' : ''}</span>
        </>
      )}
    </div>
  );
}

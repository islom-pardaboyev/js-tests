import { useMemo, useState } from 'react';
import { useCodeEditor } from '../../hooks/useCodeEditor';
import { highlight } from '../../lib/highlight';

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** Exam mode blocks pasting: the answer must be typed. */
  blockPaste?: boolean;
}

/** Textarea layered over a syntax-highlighted <pre>, with a line-number gutter. */
export function CodeEditor({ value, onChange, blockPaste = false }: Props) {
  const { area, registerLayer, onKeyDown, onScroll } = useCodeEditor({ value, onChange });
  const [notice, setNotice] = useState(false);
  const html = useMemo(() => highlight(value) + '\n', [value]);
  const lines = useMemo(() => Array.from({ length: value.split('\n').length }, (_, i) => i + 1).join('\n'), [value]);

  return (
    <div className="grid gap-1">
      <div className="editor">
        <div className="gutter" ref={registerLayer} aria-hidden="true">{lines}</div>
        <div className="stack">
          <pre className="hl" ref={registerLayer} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
          <textarea
            ref={area}
            className="code"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={onScroll}
            onPaste={(e) => {
              if (!blockPaste) return;
              e.preventDefault();
              setNotice(true);
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="off"
            aria-label="Code editor. Tab inserts two spaces."
          />
        </div>
      </div>
      {notice && <p className="field-error" role="status">Pasting is disabled during the exam. Type your solution.</p>}
    </div>
  );
}

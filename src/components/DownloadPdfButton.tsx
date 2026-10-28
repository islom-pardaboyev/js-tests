import { useState } from 'react';
import type { Certificate } from '../lib/db';

/** Builds the certificate PDF on click (the PDF library loads only then) and saves it. */
export function DownloadPdfButton({ cert, className = 'btn' }: { cert: Certificate; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const { downloadCertificatePdf } = await import('../lib/certificatePdf');
      await downloadCertificatePdf(cert);
    } catch {
      setError('Could not build the PDF. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" className={className} onClick={() => void download()} disabled={busy} aria-busy={busy}>
        {busy ? 'Building PDF' : 'Download PDF'}
      </button>
      {error && <span className="field-error" role="alert">{error}</span>}
    </span>
  );
}

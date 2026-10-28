import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CertificateView } from '../components/CertificateView';
import { DownloadPdfButton } from '../components/DownloadPdfButton';
import { CodeLoader } from '../components/CodeLoader';
import { SAMPLE_CERT, verifyUrl } from '../lib/certificate';
import { getCertificate, type Certificate } from '../lib/db';
import { formatDate } from '../lib/format';
import { usePageMeta } from '../lib/seo';

type State = { status: 'loading' } | { status: 'missing' } | { status: 'error' } | { status: 'ok'; cert: Certificate };

function useCertificate(id: string | undefined): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    if (!id) return setState({ status: 'missing' });
    let cancelled = false;
    setState({ status: 'loading' });
    getCertificate(id)
      .then((cert) => !cancelled && setState(cert ? { status: 'ok', cert } : { status: 'missing' }))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, [id]);
  return state;
}

export default function CertificatePage() {
  const { certId } = useParams();
  const isSample = certId === 'sample';
  const state = useCertificate(isSample ? undefined : certId);
  const [copied, setCopied] = useState(false);
  const shown: State = isSample ? { status: 'ok', cert: SAMPLE_CERT } : state;

  usePageMeta({
    title: isSample ? 'Sample certificate' : 'Certificate verification',
    description: 'Verify a JSTests certificate: name, test, score and issue date, checked against the JSTests database.',
    noindex: !isSample,
  });

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="container grid justify-items-center gap-8 py-12">
      {shown.status === 'loading' && <div className="w-full max-w-[820px]"><CodeLoader scope="cert" /></div>}
      {shown.status === 'missing' && (
        <div className="panel grid max-w-[560px] gap-4 p-8">
          <h1>Certificate not found</h1>
          <p className="mono-note !text-[var(--bad)]">TypeError: certificate is null</p>
          <p className="muted">No certificate has the ID "{certId}". Check the link or QR code.</p>
          <Link to="/verify" className="btn w-fit">Try another ID</Link>
        </div>
      )}
      {shown.status === 'error' && <div className="banner error max-w-[560px]" role="alert">Could not check this certificate. Check your connection and reload.</div>}
      {shown.status === 'ok' && (
        <>
          <div className="rise w-full max-w-[820px]"><CertificateView cert={shown.cert} sample={isSample} /></div>
          <div className="rise flex w-full max-w-[820px] flex-wrap items-center justify-between gap-3" style={{ '--i': 2 } as React.CSSProperties}>
            <p className="muted text-[0.875rem]">{isSample ? 'Design sample. Real certificates are issued after a passed test.' : `Found in the JSTests database. Issued ${formatDate(shown.cert.createdAt)}.`}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn btn-sm" onClick={() => void copy(verifyUrl(shown.cert.id))}>{copied ? 'Link copied' : 'Copy verification link'}</button>
              {!isSample && <DownloadPdfButton cert={shown.cert} className="btn btn-primary btn-sm" />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

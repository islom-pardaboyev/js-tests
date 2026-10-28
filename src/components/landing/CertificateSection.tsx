import { Link } from 'react-router-dom';
import { SAMPLE_CERT } from '../../lib/certificate';
import { CertificateView } from '../CertificateView';
import { VerifyBox } from '../VerifyBox';

export function CertificateSection() {
  return (
    <section className="container grid gap-14 py-16" aria-labelledby="cert-title">
      <div className="reveal grid max-w-[62ch] gap-4">
        <h2 id="cert-title">A certificate anyone can check</h2>
        <p className="muted text-[1.0625rem]">
          Pass at 70% or more to get a certificate with a unique ID, link and QR code. Scanning it opens the stored record.
        </p>
      </div>
      <div className="reveal grid justify-items-center"><CertificateView cert={SAMPLE_CERT} sample /></div>
      <div className="reveal grid gap-6 md:grid-cols-2 md:items-end">
        <div className="panel p-7"><VerifyBox /></div>
        <p className="muted">
          Checking a certificate? Enter its ID, or <Link to="/verify">open the verification page</Link>.
        </p>
      </div>
    </section>
  );
}

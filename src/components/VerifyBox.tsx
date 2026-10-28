import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractCertId } from '../lib/certificate';

/** Paste a certificate ID or a full verification link, then open its record. */
export function VerifyBox() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const id = extractCertId(value);
    if (!id) return setError('Not a valid certificate ID. The format is JST-XXXX-XXXX-XXXX.');
    setError(null);
    navigate(`/certificate/${id}`);
  };

  return (
    <form onSubmit={submit} className="grid gap-2" noValidate>
      <label htmlFor="verify-id" className="font-semibold">Certificate ID or link</label>
      <div className="flex flex-wrap gap-2">
        <input
          id="verify-id"
          className="input input-mono min-w-[220px] flex-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="JST-ABCD-EFGH-JKLM"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'verify-err' : undefined}
        />
        <button type="submit" className="btn btn-primary">Verify</button>
      </div>
      {error && <p id="verify-err" className="field-error" role="alert">{error}</p>}
    </form>
  );
}

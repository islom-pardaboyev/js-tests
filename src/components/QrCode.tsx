import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size?: number;
  label?: string;
}

/**
 * QR code for a URL, drawn as an SVG by the `qrcode` package. It always sits on
 * a light tile so scanners work in both themes. Error correction level "M"
 * keeps it readable if the certificate is printed or slightly damaged.
 */
export function QrCode({ value, size = 128, label = 'QR code' }: Props) {
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0f2a22', light: '#00000000' } })
      .then((out) => !cancelled && setSvg(out))
      .catch(() => !cancelled && setSvg(''));
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="qr-tile" style={{ width: size, height: size }} role="img" aria-label={label}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

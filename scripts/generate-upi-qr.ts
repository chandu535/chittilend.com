/**
 * Generates the static UPI QR used as the header image on payment reminder templates,
 * and uploads it to R2.
 *
 *   npm run qr:generate           preview only, writes nothing
 *   npm run qr:generate -- --write  generate and upload
 *
 * The QR deliberately carries **no amount**. UPI apps decline prefilled-amount intents to
 * a personal (P2P) address, which is why the upi:// link in the reminder was refused —
 * an amount-less QR is not subject to that restriction, so the borrower scans it and
 * types the figure the message already states.
 *
 * Static by design: the payee never changes, so this runs once rather than per message.
 */
import { PutObjectCommand } from '@aws-sdk/client-s3';
import QRCode from 'qrcode';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '../src/lib/r2';

const OBJECT_KEY = 'static/upi-qr.png';

async function main() {
  const write = process.argv.includes('--write');

  const vpa = process.env.UPI_VPA;
  if (!vpa) throw new Error('UPI_VPA is not set');
  const payeeName = process.env.UPI_PAYEE_NAME || 'ChittiLend';

  // The VPA is written raw. encodeURIComponent turns "@" into "%40", and some UPI apps
  // fail to resolve a percent-encoded payee address — every published UPI QR carries the
  // literal "@". The payee name is encoded because it can contain spaces.
  // Amount omitted on purpose — see the note above.
  if (!/^[\w.\-]+@[\w.\-]+$/.test(vpa)) {
    throw new Error(`UPI_VPA "${vpa}" does not look like a VPA; refusing to encode it into a QR`);
  }
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(payeeName)}&cu=INR`;

  console.log('payee   :', vpa);
  console.log('name    :', payeeName);
  console.log('encoded :', upiUri);

  const png = await QRCode.toBuffer(upiUri, {
    type: 'png',
    // Generous quiet zone and size: this is scanned off a phone screen, sometimes a
    // photographed one, so legibility matters more than file size.
    width: 800,
    margin: 3,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
  });

  console.log('size    :', `${(png.length / 1024).toFixed(1)} KB`);

  if (!write) {
    console.log('\nPreview only. Pass --write to upload.');
    return;
  }

  if (!R2_BUCKET || !R2_PUBLIC_URL) {
    throw new Error('R2_BUCKET_NAME and R2_PUBLIC_URL must be set');
  }

  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: OBJECT_KEY,
    Body: png,
    ContentType: 'image/png',
    // Long cache: the object is replaced in place if the payee ever changes.
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${OBJECT_KEY}`;
  console.log('\nUploaded.');
  console.log('Set this on the server:');
  console.log(`  UPI_QR_URL=${publicUrl}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });

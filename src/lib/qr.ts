import crypto from 'crypto';

const QR_SECRET = process.env.QR_SECRET || 'fallback-qr-secret';
const QR_VALIDITY_SECONDS = 15;

export interface QRPayload {
  classId: string;
  timetableId: string;
  timestamp: number;
  expiresAt: number;
  token: string;
}

/** Generate a new QR token for a timetable slot */
export function generateQRToken(classId: string, timetableId: string): QRPayload {
  const timestamp = Date.now();
  const expiresAt = timestamp + QR_VALIDITY_SECONDS * 1000;
  const raw = `${classId}:${timetableId}:${timestamp}`;
  const token = crypto
    .createHmac('sha256', QR_SECRET)
    .update(raw)
    .digest('hex')
    .slice(0, 32);

  return { classId, timetableId, timestamp, expiresAt, token };
}

/** Encode payload to base64 string for QR display */
export function encodeQRPayload(payload: QRPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/** Decode and validate a scanned QR string */
export function decodeAndValidateQR(
  encoded: string,
  expectedClassId: string,
  expectedTimetableId: string
): { valid: boolean; reason?: string } {
  try {
    const payload: QRPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString());

    if (Date.now() > payload.expiresAt) return { valid: false, reason: 'QR expired' };
    if (payload.classId !== expectedClassId) return { valid: false, reason: 'Class mismatch' };
    if (payload.timetableId !== expectedTimetableId) return { valid: false, reason: 'Timetable mismatch' };

    // Re-derive token and compare
    const raw = `${payload.classId}:${payload.timetableId}:${payload.timestamp}`;
    const expectedToken = crypto
      .createHmac('sha256', QR_SECRET)
      .update(raw)
      .digest('hex')
      .slice(0, 32);

    if (!crypto.timingSafeEqual(Buffer.from(payload.token), Buffer.from(expectedToken))) {
      return { valid: false, reason: 'Invalid token signature' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Malformed QR data' };
  }
}

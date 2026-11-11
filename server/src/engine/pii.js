// PII Guard & OTP Shield (UU PDP Compliance).
// Blocks bank/m-banking OTPs locally: ZERO bytes leave the device.
// Redacts phone numbers and addresses from chat before AI processing.

const OTP_PATTERNS = [
  /\b(?:kode\s*otp|otp\s*anda|kode\s*verifikasi|verification\s*code|one-time\s*password)\b/i,
  /\bjangan\s*(?:berikan|kasih|share|bagikan)\s*(?:kode|otp|kepada\s*siapa\s*pun)\b/i,
  /\b(?:otp|kode\s*rahasia)\s*:\s*[0-9]{4,8}\b/i,
  /\b(?:bca|mandiri|bni|bri|cimb|dana|ovo|gopay|shopeepay)\s*:\s*(?:kode\s*otp|[0-9]{4,8})\b/i,
];

const PHONE_REGEX = /(\+?62|08)[0-9\s-]{8,14}[0-9]/g;
const ADDRESS_REGEX = /\b(jl\.|jalan|komplek|blok|rt\s*\d+|rw\s*\d+|kelurahan|kecamatan|kel\.|kec\.|no\.\s*\d+)[^,\n]{5,60}/gi;

export function inspectPrivacy(text, packageName = 'unknown') {
  const raw = String(text || '');

  // 1. Check for sensitive OTP or Banking verification
  for (const pattern of OTP_PATTERNS) {
    if (pattern.test(raw)) {
      return {
        blocked: true,
        reason: 'SENSITIVE_OTP_BLOCKED',
        kind: 'OTP_DETECTED',
        preview: raw.slice(0, 60) + (raw.length > 60 ? '...' : ''),
        cleanText: null,
        redactions: 0,
      };
    }
  }

  // 2. Client-side PII Redaction
  let redactions = 0;
  let cleanText = raw.replace(PHONE_REGEX, (m) => {
    redactions++;
    return '[REDACTED_PHONE]';
  });

  cleanText = cleanText.replace(ADDRESS_REGEX, (m) => {
    redactions++;
    return '[REDACTED_ADDRESS]';
  });

  return {
    blocked: false,
    reason: null,
    kind: redactions > 0 ? 'PII_REDACTED' : 'CLEAN',
    preview: raw.slice(0, 60),
    cleanText,
    redactions,
  };
}

import crypto from 'crypto';

export function generateShareCode(): string {
  // Generate a 6-digit code
  const min = 100000; // 6 digits
  const max = 999999;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

// For future use if needed
export function generateUniqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  return Buffer.from(hexKey, 'hex');
}

/**
 * Encrypt sensitive text (such as payment gateway secrets)
 */
export function encryptData(text: string): string {
  if (!text) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  // Return combined format: iv:tag:ciphertext (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt sensitive text
 */
export function decryptData(encryptedStr: string): string {
  if (!encryptedStr) return '';
  try {
    const parts = encryptedStr.split(':');
    if (parts.length !== 3) {
      // If not in encrypted format (e.g. plain JSON in development seed), return as is
      return encryptedStr;
    }
    
    const [ivB64, tagB64, textB64] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(textB64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption failed, falling back to original string:', error);
    return encryptedStr;
  }
}

/**
 * Mask secret key for UI display (only show last 4 chars)
 * e.g. "sk_test_1234567890abcdef" -> "••••••••cdef"
 */
export function maskSecret(secret: string): string {
  if (!secret || secret.length < 5) return '••••••••';
  const lastFour = secret.slice(-4);
  return `••••••••••••${lastFour}`;
}
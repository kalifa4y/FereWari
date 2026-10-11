import { db, AppSettings } from '../db/db';

export const DEFAULT_PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTE_LENGTH = 16;

/**
 * Converts a Uint8Array buffer into a lowercase hexadecimal string.
 */
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a hexadecimal string into a Uint8Array.
 */
function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generates a cryptographically secure random salt as a hex string.
 */
export function generateSalt(lengthBytes: number = SALT_BYTE_LENGTH): string {
  const salt = new Uint8Array(lengthBytes);
  globalThis.crypto.getRandomValues(salt);
  return bufferToHex(salt);
}

/**
 * Computes the PBKDF2-SHA256 salted hash of a PIN using the Web Crypto API.
 * If saltHex is not provided, a fresh 16-byte random salt is generated.
 * Supports configurable iterations (default: 100,000 for balanced mobile performance).
 */
export async function hashPin(
  pin: string,
  saltHex?: string,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<{ hash: string; salt: string; iterations: number }> {
  const effectiveSaltHex = saltHex || generateSalt();
  const saltBytes = hexToBuffer(effectiveSaltHex);
  const pinBytes = new TextEncoder().encode(pin);

  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    pinBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );

  return {
    hash: bufferToHex(derivedBits),
    salt: effectiveSaltHex,
    iterations: iterations,
  };
}

export interface PinVerificationResult {
  valid: boolean;
  needsMigration: boolean;
}

/**
 * Verifies a PIN against stored settings (either modern hashed or legacy plaintext).
 * For existing profiles without pinIterations, falls back safely to 100,000 iterations.
 * Never mutates settings or writes to database directly.
 */
export async function verifyPin(
  pin: string,
  settings: Pick<AppSettings, 'pinCode' | 'pinHash' | 'pinSalt' | 'pinIterations'> | null | undefined
): Promise<PinVerificationResult> {
  if (!settings || (!settings.pinHash && !settings.pinCode)) {
    return { valid: false, needsMigration: false };
  }

  // 1. Modern salted hash check
  if (settings.pinHash && settings.pinSalt) {
    try {
      const iterationsToUse = settings.pinIterations || DEFAULT_PBKDF2_ITERATIONS;
      const derived = await hashPin(pin, settings.pinSalt, iterationsToUse);
      const isValid = derived.hash === settings.pinHash;
      return { valid: isValid, needsMigration: false };
    } catch (err) {
      console.error('Cryptographic verification error:', err);
      return { valid: false, needsMigration: false };
    }
  }

  // 2. Legacy plaintext PIN check (backward compatibility)
  if (settings.pinCode) {
    const isValid = pin === settings.pinCode;
    return { valid: isValid, needsMigration: isValid };
  }

  return { valid: false, needsMigration: false };
}

/**
 * Migrates a verified legacy plaintext PIN to modern salted PBKDF2 hash in IndexedDB.
 * Removes pinCode in the database and updates pinHash, pinSalt & pinIterations.
 */
export async function migratePinIfNeeded(
  pin: string,
  settings: AppSettings
): Promise<AppSettings> {
  if (!settings.pinCode || settings.pinHash) {
    return settings;
  }

  const verification = await verifyPin(pin, settings);
  if (!verification.valid || !verification.needsMigration) {
    return settings;
  }

  const { hash, salt, iterations } = await hashPin(pin);
  const updatedSettings: AppSettings = {
    ...settings,
    pinHash: hash,
    pinSalt: salt,
    pinIterations: iterations,
  };
  delete updatedSettings.pinCode;

  try {
    if (typeof indexedDB !== 'undefined') {
      await db.settings.put(updatedSettings);
    }
  } catch (err) {
    console.error('Error saving migrated PIN to IndexedDB:', err);
  }

  return updatedSettings;
}

/**
 * Checks if a PIN is configured on the given settings (modern or legacy).
 */
export function isPinConfigured(settings?: AppSettings | null): boolean {
  if (!settings) return false;
  return Boolean(settings.pinHash || settings.pinCode);
}

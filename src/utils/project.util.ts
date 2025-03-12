import { DateTime } from 'luxon';
import { BadRequestException } from '@nestjs/common';
import { COMPANY_NAME } from '../constants/global.constant';
import * as path from 'path';
import * as crypto from 'crypto';
import { KNOWLEDGE_SOURCE_PASSWORD_ENCODER_SECRET } from '../constants/jwt.constants';

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

export const generatePassword = async (length: number): Promise<string> => {
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const DIGITS = '0123456789';
  const PUNCTUATION = '!@#$&*';
  const ALL = LOWER + UPPER + DIGITS + PUNCTUATION;

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALL.length);
    password += ALL.charAt(randomIndex);
  }

  return password;
};

export const generateRandomNumberByLength = (length: number): number => {
  const end = Math.pow(10, length); // Calculate the upper limit
  const start = end / 10; // Calculate the lower limit
  // Generate a random number between start (inclusive) and end (exclusive)
  return Math.floor(Math.random() * (end - start)) + start;
};

export const getLongFromLocalDateTimeByZone = (
  localDateTime: Date,
  zoneId: string,
): number => {
  try {
    return DateTime.fromJSDate(localDateTime).setZone(zoneId).toMillis();
  } catch (error) {
    return 0; // Return 0 in case of an error
  }
};

export const safeStringify = (obj) => {
  return JSON.stringify(obj, (key, value) => {
    // Exclude undefined values
    if (value === undefined) {
      return null; // or omit this property by returning undefined
    }
    return value;
  });
};

export const validEmailChecker = (email: string): boolean => {
  // Check if the email is provided
  if (!email) {
    throw new BadRequestException('Please provide a valid email');
  }
  // Validate the email format using a regular expression
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestException('Invalid email format');
  }
  return true;
};

export const ddMMYYYFormat = (date: Date) => {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const generateTOTPUrlForAuthenticator = (
  username: string,
  secret: string,
): string => {
  return `otpauth://totp/${username}?secret=${secret}&issuer=${COMPANY_NAME}`;
};

export const generateTOTPQRCodeCenterText = (
  username: string,
  date: number,
): string => {
  return `${username}\nActivation Valid till\n${ddMMYYYFormat(new Date(Number(date)))}`;
};

export const isValidString = (value: string | undefined | null): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const pathBaseName = (folderPath: string): string => {
  return path.basename(folderPath);
};

// Encrypt function
export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(KNOWLEDGE_SOURCE_PASSWORD_ENCODER_SECRET),
    iv,
  );
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt function
export function decrypt(text: string): string {
  const [ivHex, encryptedText] = text.split(':');
  const ivBuffer = Buffer.from(ivHex, 'hex');
  const encryptedBuffer = Buffer.from(encryptedText, 'hex');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(KNOWLEDGE_SOURCE_PASSWORD_ENCODER_SECRET),
    ivBuffer,
  );
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);
  return decrypted.toString();
}

export const stringToBigint = (value: string): bigint => {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
};

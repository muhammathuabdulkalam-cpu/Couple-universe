import { AppError } from '../utils/AppError';
import { HTTP_STATUS } from '../constants';

export class ValidationService {
  static validateEmail(email?: string): string {
    if (!email || !email.trim()) {
      throw new AppError('Email address is required.', HTTP_STATUS.BAD_REQUEST);
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new AppError('Please provide a valid email address.', HTTP_STATUS.BAD_REQUEST);
    }
    return cleanEmail;
  }

  static validatePassword(password?: string, isRequired: boolean = true): void {
    if (!password) {
      if (isRequired) {
        throw new AppError('Password is required.', HTTP_STATUS.BAD_REQUEST);
      }
      return;
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', HTTP_STATUS.BAD_REQUEST);
    }
  }

  static validatePhone(phone?: string): string {
    if (!phone) return '';
    return phone.trim();
  }
}

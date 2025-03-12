// src/auth/payloads/login-response.dto.ts

import { Token } from './token';

/**
 * Created by IntelliJ IDEA.
 * User: Joniyed Bhuiyan
 * Date: ১৫/৪/২৪
 * Time: ১১:২৯ AM
 * Email: joniyed.bhuiyan@gmail.com
 */

export class LoginResponse<T> {
  token: Token; // Ensure this matches the Token interface
  user: T;

  constructor(token: Token, user: T) {
    this.token = token;
    this.user = user;
  }
}

import { Injectable, LoggerService } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger, format, transports } from 'winston';
import { safeStringify } from '../utils/project.util';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger;
  private logDirectory = path.join(__dirname, '../../logs');
  private currentLogFile = path.join(this.logDirectory, 'current.log');
  private archiveDirectory = path.join(this.logDirectory, 'archived');

  constructor() {
    this.createLogDirectories();
    this.createLogFile();
    this.initializeLogger();
  }

  log(message: string) {
    this.checkAndRotateLogs();
    this.logger.info(message);
  }

  error(error: any) {
    this.checkAndRotateLogs();
    this.logger.error(error);
  }

  warn(message: string) {
    this.checkAndRotateLogs();
    this.logger.warn(message);
  }

  debug(message: string) {
    this.checkAndRotateLogs();
    this.logger.debug(message);
  }

  // Add verbose method
  verbose(message: string) {
    this.checkAndRotateLogs();
    this.logger.info(`VERBOSE: ${message}`);
  }

  // Live request logging
  logRequest(req: Request) {
    // Get the client IP address
    const clientIpRaw =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Handle the case where clientIpRaw can be a string or an array of strings
    const clientIp = Array.isArray(clientIpRaw) ? clientIpRaw[0] : clientIpRaw;

    // Function to determine if the IP is IPv4 or IPv6
    const getFormattedIp = (ip: string) => {
      if (ip.includes('::ffff:')) {
        return ip.replace(/^::ffff:/, ''); // Strip IPv4-mapped IPv6 prefix to return IPv4
      }
      return ip; // Return the IP as-is (it could be IPv6)
    };

    const formattedIp = getFormattedIp(clientIp);

    // Extract the User-Agent
    const userAgent = req.headers['user-agent'];

    // Parse the User-Agent manually
    const browserInfo = this.parseUserAgent(userAgent);

    // Prepare the comprehensive log object
    const clientInfo = {
      clientIp: formattedIp,
      clientBrowser: browserInfo.browser,
      clientOS: browserInfo.os,
      userAgent: userAgent,
    };

    // Log the request information
    this.logger.info(
      `Request => url: ${req.originalUrl}, method: ${req.method}, query: ${safeStringify(req.query)}, headers: ${safeStringify(req.headers)}, client-info: ${safeStringify(clientInfo)}`,
    );
  }

  logResponse(req: Request, res: Response, responseBody: any) {
    const status = res.statusCode;
    const responsePayload =
      status === 200 || status === 201 ? 'success' : responseBody;
    this.logger.info(
      `Response => url: ${req.originalUrl}, method: ${req.method}, status: ${status}, body: ${safeStringify(responsePayload)}`,
    );
  }

  logRequestBody(req: Request, body: any) {
    this.logger.info(`Request Body => ${safeStringify(body)}`);
  }

  // Simple User-Agent parser
  parseUserAgent(userAgent: string) {
    let browser = 'Unknown';
    let os = 'Unknown';

    // Detect the browser
    if (userAgent.includes('Chrome')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      browser = 'Safari';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      browser = 'Internet Explorer';
    }

    // Detect the operating system
    if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Macintosh')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    } else if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) {
      os = 'iOS';
    }

    return { browser, os };
  }

  getFormattedIp = (ip: string) => {
    if (ip.includes('::ffff:')) {
      return ip.replace(/^::ffff:/, ''); // Strip IPv4-mapped IPv6 prefix to return IPv4
    }
    return ip; // Return the IP as-is (it could be IPv6)
  };

  private createLogDirectories() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
    if (!fs.existsSync(this.archiveDirectory)) {
      fs.mkdirSync(this.archiveDirectory, { recursive: true });
    }
  }

  private createLogFile() {
    if (!fs.existsSync(this.currentLogFile)) {
      fs.writeFileSync(this.currentLogFile, '', { flag: 'w' });
    }
  }

  private initializeLogger() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }), // Include stack trace in the logs
        format.printf(({ timestamp, level, message, stack }) => {
          // If an error object is passed, log the stack trace; otherwise, log the message.
          return stack
            ? `${timestamp} ${level.toUpperCase()}: ${message} - Stack: ${stack}`
            : `${timestamp} ${level.toUpperCase()}: ${message}`;
        }),
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp(),
            format.errors({ stack: true }), // Include stack trace in console logs as well
            format.printf(({ timestamp, level, message, stack }) => {
              return stack
                ? `${timestamp} ${level}: ${message} - Stack: ${stack}`
                : `${timestamp} ${level}: ${message}`;
            }),
          ),
        }),
        new transports.File({ filename: this.currentLogFile }), // Log to file
      ],
    });
  }

  private checkAndRotateLogs() {
    const stats = fs.statSync(this.currentLogFile);
    if (stats.size > 5 * 1000 * 1024) {
      this.rotateLog();
    }
  }

  private rotateLog() {
    const date = new Date();
    const dateString = `${date.getFullYear()}_${this.getMonthName(date.getMonth())}_${date.getDate()}`;
    const archiveFileName = path.join(
      this.archiveDirectory,
      `${dateString}_${this.getNextFileIndex(dateString)}.log`,
    );

    fs.renameSync(this.currentLogFile, archiveFileName);
    this.createLogFile();
    this.initializeLogger();
  }

  //===============================================================
  //===============================================================
  //===============================================================

  private getMonthName(monthIndex: number): string {
    const monthNames = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];
    return monthNames[monthIndex];
  }

  private getNextFileIndex(dateString: string): number {
    const files = fs
      .readdirSync(this.archiveDirectory)
      .filter((file) => file.startsWith(dateString))
      .map((file) => parseInt(file.split('_').pop().split('.')[0], 10));
    return files.length > 0 ? Math.max(...files) + 1 : 1;
  }
}

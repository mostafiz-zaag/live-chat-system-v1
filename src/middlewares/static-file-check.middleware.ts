import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { STATIC } from '../constants/global.constant'; // Import STATIC constant

@Injectable()
export class StaticFileCheckMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Get the project root directory
    const rootDir = process.cwd(); // This gives you the root directory of your project

    // Construct the file path relative to the root directory
    const originalUrl = req.originalUrl;
    const relativePath = originalUrl.replace(new RegExp(`^/${STATIC}`), ''); // Remove /static part from the URL
    const filePath = path.join(rootDir, STATIC, relativePath); // Resolve the full file path

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      // If file doesn't exist, throw an error
      throw new BadRequestException(`File not found: ${originalUrl}`);
    }

    next();
  }
}

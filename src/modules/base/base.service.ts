import { Injectable } from '@nestjs/common';
import {
  PROJECT_NAME,
  PROJECT_VERSION,
} from '../../constants/project.constant';

@Injectable()
export class BaseService {
  constructor() {}

  getBaseData(): any {
    return {
      projectName: PROJECT_NAME,
      projectVersion: PROJECT_VERSION,
      currentThread: process.pid, // Alternatively, you can use process.pid
      desc: 'Simple Base Url',
      currentDateTime: new Date().toISOString(), // Get current date-time
    };
  }

  getAPIBaseData(): any {
    return {
      projectName: PROJECT_NAME,
      projectVersion: PROJECT_VERSION,
      currentThread: process.pid, // Alternatively, you can use process.pid
      desc: 'API Base Url',
      currentDateTime: new Date().toISOString(), // Get current date-time
    };
  }

  getSecuredAPIBaseData(): any {
    return {
      projectName: PROJECT_NAME,
      projectVersion: PROJECT_VERSION,
      currentThread: process.pid, // Alternatively, you can use process.pid
      desc: 'Secured API Base Url',
      currentDateTime: new Date().toISOString(), // Get current date-time
    };
  }
}

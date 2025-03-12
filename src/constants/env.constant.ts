import * as dotenv from 'dotenv';
import * as process from 'node:process';

// Load environment variables from the .env file
dotenv.config();

// Export the environment variables
export const envConfig = {
  SERVER_PORT: process.env.SERVER_PORT,
};

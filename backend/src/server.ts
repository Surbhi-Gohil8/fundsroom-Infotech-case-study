import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running in ${env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api/docs`);
});

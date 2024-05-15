import 'dotenv/config';
import app from './app';
import config from './configs';
import logger from './utils/logger';

(async () => {
  try {
    app.listen(config.port, () => {
      logger.info(`🌐 Server running on port ${config.port} 🔥`)
    })
  } catch (error) {
    logger.error(error)
  }
})();
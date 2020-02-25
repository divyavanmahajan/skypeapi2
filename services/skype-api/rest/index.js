// This should not be modified by you unless you know what you are doing!
import serverless from 'serverless-http';
import express from 'express';
import config from '../../../config';
import { initPermissions } from '../../../libs/permissions';
import { loggerAPI } from '../../../libs/logging';
import { router } from './router';

const app = express();
app.set('json spaces', 2);

app.use(`/${config.STAGE}`, router);

// Create Serveless-http wrapper for express.
const serverlessHandler = serverless(app);
export const handler = async (event, context) => {
  // Initialize permissions
  initPermissions(event, context);
  // Debug logging.
  loggerAPI.debug(`Environment\n${JSON.stringify(process.env, null, 2)}`);
  loggerAPI.debug(`Config\n${JSON.stringify(config, null, 2)}`);
  loggerAPI.debug(`Event\n${JSON.stringify(event, null, 2)}`);
  loggerAPI.debug(`Context\n${JSON.stringify(context, null, 2)}`);
  const result = await serverlessHandler(event, context);
  loggerAPI.debug(`Result\n${JSON.stringify(result, null, 2)}`);
  return result;
};

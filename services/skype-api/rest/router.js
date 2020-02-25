import express from 'express';
import { logHandler } from './logHandler';
export const router = express.Router();
router.post('/log', logHandler);

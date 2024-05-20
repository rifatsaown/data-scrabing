import express, { Router } from 'express';
import upload from '../../middlewares/multer.middleware';
import { formHandler } from './formHandle.controller';

const router: Router = express.Router();

router.route('/upload').post(upload.fields([
    { name: 'idFile', maxCount: 1 },
    { name: 'dataFile', maxCount: 1 }
]), formHandler);

export const formHandleRoutes = router;

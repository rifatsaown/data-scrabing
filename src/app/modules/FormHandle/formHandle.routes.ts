import express, { Router } from 'express';
import upload from '../../middlewares/multer.middleware';
import { formHandler } from './formHandle.controller';

const router: Router = express.Router();

router.route('/upload').post(upload.single("file"), formHandler);

export const formHandleRoutes = router;

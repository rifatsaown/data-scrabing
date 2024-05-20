import express, { Router } from 'express';
import upload from '../../middlewares/multer.middleware';

const router: Router = express.Router();

router.route('/upload').post(upload.single('file'), );

export const fileHandleRoutes = router;

import express from 'express';
import { fileHandleRoutes } from '../modules/FileHandle/filehandle.routes';
import { scrapperRoutes } from '../modules/Scrapper/scrapper.routes';

const router = express.Router();

const moduleRoutes = [
    { path: '/scrapper', route: scrapperRoutes },
    { path: '/file', route: fileHandleRoutes }
]

moduleRoutes.forEach(route => router.use(route.path, route.route));
export default router;
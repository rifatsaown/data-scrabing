import express from 'express';
import { formHandleRoutes } from '../modules/FormHandle/formHandle.routes';
import { scrapperRoutes } from '../modules/Scrapper/scrapper.routes';

const router = express.Router();

const moduleRoutes = [
    { path: '/scrapper', route: scrapperRoutes },
    { path: '/form', route: formHandleRoutes }
]

moduleRoutes.forEach(route => router.use(route.path, route.route));
export default router;
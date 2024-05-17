import express from 'express'
import { scrapperRoutes } from '../modules/Scrapper/scrapper.routes'

const router = express.Router()

const moduleRoutes = [
    { path: '/scrapper', route: scrapperRoutes }
]

moduleRoutes.forEach(route => router.use(route.path, route.route))
export default router

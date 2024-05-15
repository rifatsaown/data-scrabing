import express from 'express'
import { scrapperRoutes } from '../modules/Scrapper/scrapper.routes'
import { usersRoutes } from '../modules/Users/users.routes'

const router = express.Router()

const moduleRoutes = [
    { path: '/users', route: usersRoutes },
    { path: '/scrapper', route: scrapperRoutes }
]

moduleRoutes.forEach(route => router.use(route.path, route.route))
export default router

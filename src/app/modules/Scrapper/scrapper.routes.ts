import express, { Router } from 'express'
import { closeAllBrowser, saveDataEXL } from './scrapper.controller'


const router: Router = express.Router()
router.post('/',saveDataEXL)
router.post('/close',closeAllBrowser)


export const scrapperRoutes = router;
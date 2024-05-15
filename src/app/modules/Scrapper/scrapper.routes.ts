import express, { Router } from 'express'
import { saveDataEXL } from './scrapper.controller'


const router: Router = express.Router()
router.post('/',saveDataEXL)


export const scrapperRoutes = router
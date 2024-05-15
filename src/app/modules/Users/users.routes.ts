import express, { Router } from 'express'
import { createUser, getAllusers } from './users.controller'

const router: Router = express.Router()

router.get('/',getAllusers)
router.post('/', createUser)

export const usersRoutes = router

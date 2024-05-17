import express, { Router } from 'express'

const router: Router = express.Router()

router.get('/', (req, res) => {
    res.send('File Handle Module')
})

export const fileHandleRoutes = router
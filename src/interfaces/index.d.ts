import { JwtPayload } from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload | null
    }
  }
}

declare global {
  namespace Express {
    interface MulterFile {
      buffer: Buffer
      fieldname: string
      originalname: string
      encoding: string
      mimetype: string
      size: number
    }
  }
}

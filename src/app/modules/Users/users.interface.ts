// State.ts
import { Document } from 'mongoose'

export type User = {
  userName: string
  role: string
  email: string
} & Document

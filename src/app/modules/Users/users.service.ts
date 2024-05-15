import { Request } from 'express';
import { User } from './users.interface';
import Users from './users.model';

const getUsers = async () => {
  const result: User[] = await Users.find({})
  return result
}

const createUser = async (req:Request)=> {
  const { userName, role, email } = req.body
  const result: User = await Users.create({
    userName: userName,
    role: role,
    email: email
  })
  return result
}

export const userServices = { getUsers ,createUser}

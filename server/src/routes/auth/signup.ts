import express from "express";
import { body } from "express-validator";
import type { Request, Response } from "express";
import { validateRequest } from '@xen-tickets/common';
import { PrismaClient } from '@prisma/client';
import { Password } from "../../service/password.js";
import { randomBytes } from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

router.post("/api/users/signup", [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username không được để trống')
        .isLength({ min: 3, max: 20 })
        .withMessage('Username phải có độ dài từ 3 đến 20 ký tự')
        .isAlphanumeric()
        .withMessage('Username chỉ được chứa chữ cái và số (không có ký tự đặc biệt)'),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
], validateRequest, async(req: Request,res: Response)=>{
    const {username, password} = req.body;
    
    const hashedPassword = await Password.toHash(password);
    const userId = randomBytes(8).toString('hex');

    const newUser = await prisma.user.create({
        data:{
            userId: userId,
            username: username,
            password: hashedPassword
        },
        select: {
            userId: true,
            username: true,
            createdAt: true
        }
    })
    
    console.log(newUser);

    res.status(201).send(newUser);
});

export {router as signupRouter}
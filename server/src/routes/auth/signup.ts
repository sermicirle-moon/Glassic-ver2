import express from "express";
import { body, validationResult } from "express-validator";
import type { Request, Response } from "express";
import { BadRequestError, validateRequest } from '@xen-tickets/common';
import { Prisma } from "@prisma/client";

const router = express.Router();

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

    // const existingUser = await 

    console.log("creating a user");

    res.send({});
});

export {router as signupRouter}
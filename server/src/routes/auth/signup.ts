import express from "express";
import { body } from "express-validator";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { validateRequest, BadRequestError } from '@xen-tickets/common';
import { prisma } from "../../service/prisma.js";
import { Password } from "../../service/password.js";
import { UserService } from "../../service/user-service.js";
import { requireAdmin } from "../../middlewares/require-admin.js";

const router = express.Router();

router.post("/api/users/signup", [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username không được để trống')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username phải có độ dài từ 3 đến 30 ký tự'),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
], validateRequest, async (req: Request, res: Response) => {
    const { username, password, userId: customUserId } = req.body;

    const userId = await UserService.getOrGenerateUserId(customUserId);
    const hashedPassword = await Password.toHash(password);

    const newUser = await prisma.user.create({
        data: {
            userId,
            username,
            password: hashedPassword,
            role: "ADMIN"
        },
        select: {
            id: true,
            userId: true,
            username: true,
            role: true,
            createdAt: true
        }
    });

    const userJwt = jwt.sign(
        {
            id: newUser.id,
            userId: newUser.userId,
            username: newUser.username,
            role: newUser.role
        },
        process.env.JWT_KEY!
    );

    req.session = {
        jwt: userJwt
    };

    res.status(201).send(newUser);
});

router.post("/api/users/createTeacher", [
    requireAdmin,
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username không được để trống')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username phải có từ 3 đến 30 ký tự'),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('teacherId')
        .trim()
        .notEmpty()
        .withMessage('Mã giáo viên (teacherId) không được để trống'),
    body('teacherName')
        .trim()
        .notEmpty()
        .withMessage('Tên giáo viên không được để trống'),
    body('email')
        .isEmail()
        .withMessage('Email giáo viên không hợp lệ'),
    body('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Số điện thoại không được để trống'),
    body('dateOfBirth')
        .trim()
        .notEmpty()
        .withMessage('Ngày sinh không được để trống'),
    body('gender')
        .trim()
        .notEmpty()
        .withMessage('Giới tính không được để trống'),
    body('address')
        .trim()
        .notEmpty()
        .withMessage('Địa chỉ không được để trống')
], validateRequest, async (req: Request, res: Response) => {
    const {
        username,
        password,
        userId: customUserId,
        teacherId,
        teacherName,
        dateOfBirth,
        phoneNumber,
        email,
        gender,
        address
    } = req.body;

    const existingTeacher = await prisma.teacher.findUnique({
        where: { teacherId }
    });
    if (existingTeacher) {
        throw new BadRequestError("Mã giáo viên (teacherId) đã tồn tại");
    }

    const existingEmail = await prisma.teacher.findFirst({
        where: { email }
    });
    if (existingEmail) {
        throw new BadRequestError("Email giáo viên đã tồn tại");
    }

    const userId = await UserService.getOrGenerateUserId(customUserId);
    const hashedPassword = await Password.toHash(password);

    const newTeacherUser = await prisma.user.create({
        data: {
            userId,
            username,
            password: hashedPassword,
            role: "TEACHER",
            teacher: {
                create: {
                    teacherId,
                    teacherName,
                    dateOfBirth,
                    phoneNumber,
                    email,
                    gender,
                    address
                }
            }
        },
        select: {
            id: true,
            userId: true,
            username: true,
            role: true,
            createdAt: true,
            teacher: true
        }
    });

    res.status(201).send(newTeacherUser);
});

router.post("/api/users/createStudent", [
    requireAdmin,
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username không được để trống')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username phải có từ 3 đến 30 ký tự'),
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('studentId')
        .trim()
        .notEmpty()
        .withMessage('Mã học sinh (studentId) không được để trống'),
    body('studentName')
        .trim()
        .notEmpty()
        .withMessage('Tên học sinh không được để trống'),
    body('email')
        .isEmail()
        .withMessage('Email học sinh không hợp lệ'),
    body('phoneNumber')
        .trim()
        .notEmpty()
        .withMessage('Số điện thoại không được để trống'),
    body('dateOfBirth')
        .trim()
        .notEmpty()
        .withMessage('Ngày sinh không được để trống'),
    body('gender')
        .trim()
        .notEmpty()
        .withMessage('Giới tính không được để trống'),
    body('address')
        .trim()
        .notEmpty()
        .withMessage('Địa chỉ không được để trống')
], validateRequest, async (req: Request, res: Response) => {
    const {
        username,
        password,
        userId: customUserId,
        studentId,
        studentName,
        dateOfBirth,
        phoneNumber,
        email,
        gender,
        address
    } = req.body;

    const existingStudent = await prisma.student.findUnique({
        where: { studentId }
    });
    if (existingStudent) {
        throw new BadRequestError("Mã học sinh (studentId) đã tồn tại");
    }

    const existingEmail = await prisma.student.findFirst({
        where: { email }
    });
    if (existingEmail) {
        throw new BadRequestError("Email học sinh đã tồn tại");
    }

    const userId = await UserService.getOrGenerateUserId(customUserId);
    const hashedPassword = await Password.toHash(password);

    const newStudentUser = await prisma.user.create({
        data: {
            userId,
            username,
            password: hashedPassword,
            role: "STUDENT",
            student: {
                create: {
                    studentId,
                    studentName,
                    dateOfBirth,
                    phoneNumber,
                    email,
                    gender,
                    address
                }
            }
        },
        select: {
            id: true,
            userId: true,
            username: true,
            role: true,
            createdAt: true,
            student: true
        }
    });

    res.status(201).send(newStudentUser);
});

export { router as signupRouter };

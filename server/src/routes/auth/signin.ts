import express from "express";
import { body } from "express-validator";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { validateRequest, BadRequestError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { Password } from "../../service/password.js";

const router = express.Router();

router.post(
  "/api/users/signin",
  [
    body("id")
      .trim()
      .notEmpty()
      .withMessage("Mã ID đăng nhập không được để trống"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Mật khẩu không được để trống"),
    body("role")
      .trim()
      .notEmpty()
      .withMessage("Vai trò (role: ADMIN, TEACHER, STUDENT) không được để trống")
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id, password, role } = req.body;
    const loginId = id.toString().trim();
    const loginRole = role.toString().trim().toUpperCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { userId: loginId },
          { teacher: { teacherId: loginId } },
          { student: { studentId: loginId } }
        ]
      },
      include: {
        teacher: true,
        student: true
      }
    });

    if (!existingUser || existingUser.role.toUpperCase() !== loginRole) {
      throw new BadRequestError("Mã ID, mật khẩu hoặc vai trò không chính xác");
    }

    const passwordsMatch = await Password.compare(existingUser.password, password);
    if (!passwordsMatch) {
      throw new BadRequestError("Mã ID, mật khẩu hoặc vai trò không chính xác");
    }

    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        userId: existingUser.userId,
        username: existingUser.username,
        role: existingUser.role
      },
      process.env.JWT_KEY!
    );

    req.session = {
      jwt: userJwt
    };

    const { password: _, ...userWithoutPassword } = existingUser;

    res.status(200).send(userWithoutPassword);
  }
);

export { router as signinRouter };

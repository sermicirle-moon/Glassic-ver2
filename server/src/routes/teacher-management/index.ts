import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { NotFoundError } from "@xen-tickets/common";

const router = express.Router();
router.get("/api/users/teachers", requireAdmin, async (req: Request, res: Response) => {
    const teachers = await prisma.teacher.findMany({
        orderBy: { teacherId: 'asc' }
    });
    res.send(teachers);
});

router.delete("/api/users/teachers/:teacherId", requireAdmin, async (req: Request, res: Response) => {
    const { teacherId } = req.params;

    const existingTeacher = await prisma.teacher.findUnique({
        where: { teacherId: String(teacherId) }
    });

    if (!existingTeacher) {
        throw new NotFoundError();
    }

    await prisma.teacher.delete({
        where: { teacherId: String(teacherId) }
    });

    res.status(204).send({});
});

router.put("/api/users/teachers/:teacherId", requireAdmin, async (req: Request, res: Response) => {
    const { teacherId } = req.params;
    const { teacherName, email, phoneNumber, gender, dateOfBirth, address } = req.body; 

    const existingTeacher = await prisma.teacher.findUnique({
        where: { teacherId: String(teacherId) }
    });

    if (!existingTeacher) {
        throw new NotFoundError();
    }
    const updatedTeacher = await prisma.teacher.update({
        where: { teacherId: String(teacherId) },
        data: {
            teacherName: teacherName || existingTeacher.teacherName,
            email: email || existingTeacher.email,
            phoneNumber: phoneNumber || existingTeacher.phoneNumber,
            gender: gender || existingTeacher.gender,
            dateOfBirth: dateOfBirth || existingTeacher.dateOfBirth,
            address: address || existingTeacher.address,
        }
    });

    res.send(updatedTeacher);
});

export { router as teacherManagementRouter };

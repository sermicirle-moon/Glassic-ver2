import express from "express";
import type { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError, NotFoundError } from "@xen-tickets/common";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { getParam } from "./helpers.js";

const router = express.Router();

// ADMIN: xếp học sinh vào lớp (học sinh chuyển lớp hoặc học sinh mới)
router.post("/api/users/classes/:classId/students", [
    requireAdmin,
    body("studentId")
        .trim()
        .notEmpty()
        .withMessage("Mã học sinh không được để trống")
], validateRequest, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");
    const { studentId, fromClassId } = req.body;

    const cls = await prisma.class.findUnique({
        where: { classId },
        include: { _count: { select: { enrollments: true } } }
    });
    if (!cls) {
        throw new NotFoundError();
    }

    const student = await prisma.student.findUnique({ where: { studentId } });
    if (!student) {
        throw new BadRequestError("Học sinh không tồn tại");
    }

    // Kiểm tra trong lớp đích học sinh đã ACTIVE chưa
    const existingEnrollment = await prisma.student_Class.findUnique({
        where: {
            studentId_classId: { studentId, classId }
        }
    });

    if (existingEnrollment && existingEnrollment.status === EnrollmentStatus.ACTIVE) {
        throw new BadRequestError("Học sinh đã thuộc lớp này");
    }

    const activeEnrollmentsCount = await prisma.student_Class.count({
        where: { classId, status: EnrollmentStatus.ACTIVE }
    });

    if (activeEnrollmentsCount >= cls.maxStudents) {
        throw new BadRequestError("Lớp đã đủ sĩ số tối đa");
    }

    // Nếu có truyền fromClassId (chuyển lớp trực tiếp), chuyển trạng thái lớp cũ sang TRANSFERRED
    if (fromClassId && fromClassId !== classId) {
        await prisma.student_Class.updateMany({
            where: {
                studentId,
                classId: fromClassId,
                status: EnrollmentStatus.ACTIVE
            },
            data: {
                status: EnrollmentStatus.TRANSFERRED
            }
        });
    }

    if (existingEnrollment) {
        // Học sinh từng học lớp này trước đó (TRANSFERRED/DROPPED/COMPLETED) -> quay lại học ACTIVE
        await prisma.student_Class.update({
            where: {
                studentId_classId: { studentId, classId }
            },
            data: {
                status: EnrollmentStatus.ACTIVE,
                joinDate: new Date()
            }
        });
    } else {
        // Học sinh lần đầu vào lớp này
        await prisma.student_Class.create({
            data: {
                studentId,
                classId,
                status: EnrollmentStatus.ACTIVE,
                joinDate: new Date()
            }
        });
    }

    res.send({ ...student, classId, enrollmentStatus: EnrollmentStatus.ACTIVE });
});

export { router as assignStudentRouter };

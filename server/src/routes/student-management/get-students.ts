import express from "express";
import type { Request, Response } from "express";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";

const router = express.Router();

// ADMIN: lấy danh sách toàn bộ học sinh kèm trạng thái lớp gần nhất
router.get("/api/users/students", requireAdmin, async (req: Request, res: Response) => {
    const students = await prisma.student.findMany({
        orderBy: { studentId: 'asc' },
        include: {
            enrollments: {
                orderBy: { joinDate: 'desc' },
                select: { classId: true, status: true }
            }
        }
    });

    const result = students.map((s) => {
        const activeEnrollment = s.enrollments.find((e) => e.status === EnrollmentStatus.ACTIVE);
        const lastEnrollment = s.enrollments[0];
        return {
            ...s,
            classId: activeEnrollment?.classId ?? null,
            lastClassId: lastEnrollment?.classId ?? null,
            lastStatus: lastEnrollment?.status ?? null
        };
    });

    res.send(result);
});

export { router as getStudentsRouter };

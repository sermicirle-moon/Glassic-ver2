import express from "express";
import type { Request, Response } from "express";
import { NotFoundError, BadRequestError } from "@xen-tickets/common";
import { ClassStatus, EnrollmentStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { classInclude, toClassDto, getParam } from "./helpers.js";

const router = express.Router();

// ADMIN: hoàn thành khóa học cho lớp
// Tự động chuyển Class.status sang COMPLETED và toàn bộ học sinh đang ACTIVE sang COMPLETED
router.post("/api/users/classes/:classId/complete", requireAdmin, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");

    const existing = await prisma.class.findUnique({
        where: { classId },
        include: {
            _count: {
                select: {
                    enrollments: {
                        where: { status: EnrollmentStatus.ACTIVE }
                    }
                }
            }
        }
    });

    if (!existing) {
        throw new NotFoundError();
    }

    if (existing.status === ClassStatus.COMPLETED) {
        throw new BadRequestError("Lớp học này đã ở trạng thái hoàn thành");
    }

    // Thực hiện trong một transaction để bảo đảm tính nhất quán dữ liệu
    const [updatedClass] = await prisma.$transaction([
        prisma.class.update({
            where: { classId },
            data: {
                status: ClassStatus.COMPLETED,
                endDate: existing.endDate || new Date()
            },
            include: classInclude
        }),
        prisma.student_Class.updateMany({
            where: {
                classId,
                status: EnrollmentStatus.ACTIVE
            },
            data: {
                status: EnrollmentStatus.COMPLETED
            }
        })
    ]);

    res.send(toClassDto(updatedClass));
});

export { router as completeClassRouter };


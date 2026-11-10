import express from "express";
import type { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError, NotFoundError } from "@xen-tickets/common";
import { ClassStatus, EnrollmentStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { classValidators, classInclude, toClassDto, getParam, parseClassStatus, resolveHomeroomTeacher } from "./helpers.js";

const router = express.Router();

// ADMIN: cập nhật lớp học (tên, khối, sĩ số tối đa, GVCN, trạng thái, thời gian)
router.put("/api/users/classes/:classId", [
    requireAdmin,
    ...classValidators,
    body("status")
        .optional()
], validateRequest, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");
    const { className, grade, maxStudents, status, startDate, endDate } = req.body;

    const existing = await prisma.class.findUnique({
        where: { classId },
        include: { _count: { select: { enrollments: true } } }
    });
    if (!existing) {
        throw new NotFoundError();
    }
    const currentStudentsCount = existing._count.enrollments;
    if (Number(maxStudents) < currentStudentsCount) {
        throw new BadRequestError(
            `Sĩ số tối đa không được nhỏ hơn số học sinh hiện có (${currentStudentsCount})`
        );
    }

    const homeroomTeacherId = await resolveHomeroomTeacher(req.body.homeroomTeacherId);
    const parsedStatus = parseClassStatus(status);

    const isCompleting = parsedStatus === ClassStatus.COMPLETED && existing.status !== ClassStatus.COMPLETED;

    let updated;
    if (isCompleting) {
        // Nếu chuyển sang COMPLETED, đồng bộ tất cả học sinh đang ACTIVE sang COMPLETED
        const [cls] = await prisma.$transaction([
            prisma.class.update({
                where: { classId },
                data: {
                    className,
                    grade,
                    maxStudents: Number(maxStudents),
                    status: ClassStatus.COMPLETED,
                    homeroomTeacherId,
                    ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
                    endDate: endDate ? new Date(endDate) : (existing.endDate || new Date())
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
        updated = cls;
    } else {
        updated = await prisma.class.update({
            where: { classId },
            data: {
                className,
                grade,
                maxStudents: Number(maxStudents),
                ...(parsedStatus ? { status: parsedStatus } : {}),
                homeroomTeacherId,
                ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
                ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {})
            },
            include: classInclude
        });
    }

    res.send(toClassDto(updated));
});

export { router as updateClassRouter };

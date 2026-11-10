import express from "express";
import type { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError } from "@xen-tickets/common";
import { ClassStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { classValidators, classInclude, toClassDto, resolveHomeroomTeacher } from "./helpers.js";

const router = express.Router();

// ADMIN: tạo lớp học mới
router.post("/api/users/classes", [
    requireAdmin,
    body("classId")
        .trim()
        .notEmpty()
        .withMessage("Mã lớp không được để trống"),
    ...classValidators
], validateRequest, async (req: Request, res: Response) => {
    const { classId, className, grade, maxStudents, startDate, endDate } = req.body;

    const existing = await prisma.class.findUnique({ where: { classId } });
    if (existing) {
        throw new BadRequestError("Mã lớp đã tồn tại");
    }

    const homeroomTeacherId = await resolveHomeroomTeacher(req.body.homeroomTeacherId);

    const created = await prisma.class.create({
        data: {
            classId,
            className,
            grade,
            maxStudents: Number(maxStudents),
            homeroomTeacherId,
            status: ClassStatus.ACTIVE,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null
        },
        include: classInclude
    });
    res.status(201).send(toClassDto(created));
});

export { router as createClassRouter };


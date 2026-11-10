import express from "express";
import type { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { scheduleInclude, toScheduleDto, checkScheduleConflict } from "./helpers.js";

const router = express.Router();

router.post("/api/users/schedules", [
    requireAdmin,
    body("classId")
        .trim()
        .notEmpty()
        .withMessage("Mã lớp học không được để trống"),
    body("startTime")
        .trim()
        .notEmpty()
        .isISO8601()
        .withMessage("Thời gian bắt đầu không hợp lệ"),
    body("endTime")
        .trim()
        .notEmpty()
        .isISO8601()
        .withMessage("Thời gian kết thúc không hợp lệ"),
    validateRequest
], async (req: Request, res: Response) => {
    const { classId, startTime, endTime, room, lessonTopic } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
        throw new BadRequestError("Thời gian bắt đầu phải trước thời gian kết thúc");
    }

    // Kiểm tra xung đột lịch (trùng lớp hoặc trùng giáo viên)
    const conflict = await checkScheduleConflict({
        classId: classId.trim(),
        startTime: start,
        endTime: end
    });

    if (conflict.hasConflict) {
        throw new BadRequestError(conflict.reason || "Lịch học bị trùng với lịch hiện có");
    }

    const created = await prisma.schedule.create({
        data: {
            classId: classId.trim(),
            startTime: start,
            endTime: end,
            room: typeof room === "string" && room.trim() ? room.trim() : null,
            lessonTopic: typeof lessonTopic === "string" && lessonTopic.trim() ? lessonTopic.trim() : null
        },
        include: scheduleInclude
    });

    res.status(201).send(toScheduleDto(created));
});

export { router as createScheduleRouter };


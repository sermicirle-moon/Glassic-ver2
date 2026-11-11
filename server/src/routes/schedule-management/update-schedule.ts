import express from "express";
import type { Request, Response } from "express";
import { NotFoundError, BadRequestError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { scheduleInclude, toScheduleDto, getIntParam, checkScheduleConflict, parseDateParam } from "./helpers.js";

const router = express.Router();

router.put("/api/users/schedules/:scheduleId", [
    requireAdmin
], async (req: Request, res: Response) => {
    const scheduleId = getIntParam(req, "scheduleId");

    const existing = await prisma.schedule.findUnique({
        where: { scheduleId },
        include: scheduleInclude
    });

    if (!existing) {
        throw new NotFoundError();
    }

    const { classId, startTime, endTime, room, lessonTopic } = req.body;

    const targetClassId = typeof classId === "string" && classId.trim() ? classId.trim() : existing.classId;
    const newStartTime = startTime !== undefined ? parseDateParam(startTime) : existing.startTime;
    const newEndTime = endTime !== undefined ? parseDateParam(endTime) : existing.endTime;

    if (!newStartTime || !newEndTime) {
        throw new BadRequestError("Thời gian bắt đầu hoặc kết thúc không hợp lệ");
    }

    if (newStartTime >= newEndTime) {
        throw new BadRequestError("Thời gian bắt đầu phải trước thời gian kết thúc");
    }

    // Kiểm tra xung đột nếu có sự thay đổi về thời gian hoặc lớp học
    const hasTimeOrClassChanged =
        targetClassId !== existing.classId ||
        newStartTime.getTime() !== existing.startTime.getTime() ||
        newEndTime.getTime() !== existing.endTime.getTime();

    if (hasTimeOrClassChanged) {
        const conflict = await checkScheduleConflict({
            classId: targetClassId,
            startTime: newStartTime,
            endTime: newEndTime,
            excludeScheduleId: scheduleId
        });

        if (conflict.hasConflict) {
            throw new BadRequestError(conflict.reason || "Lịch học bị trùng với lịch hiện có");
        }
    }

    const updated = await prisma.schedule.update({
        where: { scheduleId },
        data: {
            classId: targetClassId,
            startTime: newStartTime,
            endTime: newEndTime,
            room: room !== undefined ? (typeof room === "string" && room.trim() ? room.trim() : null) : existing.room,
            lessonTopic: lessonTopic !== undefined ? (typeof lessonTopic === "string" && lessonTopic.trim() ? lessonTopic.trim() : null) : existing.lessonTopic
        },
        include: scheduleInclude
    });

    res.send(toScheduleDto(updated));
});

export { router as updateScheduleRouter };


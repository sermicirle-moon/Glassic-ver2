import express from "express";
import type { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { checkScheduleConflict, formatTimeVN } from "./helpers.js";

const router = express.Router();

router.post("/api/users/schedules/recurring", [
    requireAdmin,
    body("classId")
        .trim()
        .notEmpty()
        .withMessage("Mã lớp học không được để trống"),
    body("daysOfWeek")
        .isArray({ min: 1 })
        .withMessage("Phải chọn ít nhất một thứ trong tuần"),
    body("startTime")
        .trim()
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
        .withMessage("Giờ bắt đầu phải có định dạng HH:mm (00:00 - 23:59)"),
    body("endTime")
        .trim()
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
        .withMessage("Giờ kết thúc phải có định dạng HH:mm (00:00 - 23:59)"),
    validateRequest
], async (req: Request, res: Response) => {
    const {
        classId,
        daysOfWeek,
        startTime,
        endTime,
        startDate,
        endDate,
        room,
        lessonTopic,
        skipConflicts = false,
        clientTzOffset = -420
    } = req.body;

    const tzOffset = typeof clientTzOffset === "number" ? clientTzOffset : -420;

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    if (startH * 60 + startM >= endH * 60 + endM) {
        throw new BadRequestError("Giờ bắt đầu phải trước giờ kết thúc trong ngày");
    }

    const targetClass = await prisma.class.findUnique({
        where: { classId: classId.trim() },
        include: { homeroomTeacher: true }
    });

    if (!targetClass) {
        throw new BadRequestError(`Không tìm thấy lớp học với mã "${classId}"`);
    }

    // Xác định ngày bắt đầu và kết thúc khoảng lặp
    let rangeStart: Date;
    if (startDate && typeof startDate === "string" && startDate.trim()) {
        const parsed = new Date(startDate.trim());
        rangeStart = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else if (targetClass.startDate) {
        rangeStart = new Date(targetClass.startDate);
    } else {
        rangeStart = new Date();
    }

    let rangeEnd: Date;
    if (endDate && typeof endDate === "string" && endDate.trim()) {
        const parsed = new Date(endDate.trim());
        rangeEnd = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else if (targetClass.endDate) {
        rangeEnd = new Date(targetClass.endDate);
    } else {
        // Mặc định 3 tháng (90 ngày)
        rangeEnd = new Date(rangeStart);
        rangeEnd.setDate(rangeEnd.getDate() + 90);
    }

    if (rangeStart > rangeEnd) {
        throw new BadRequestError("Ngày bắt đầu khóa học phải trước ngày kết thúc");
    }

    const validDays = (daysOfWeek as number[]).map(Number).filter(d => d >= 0 && d <= 6);
    if (validDays.length === 0) {
        throw new BadRequestError("Danh sách thứ trong tuần không hợp lệ");
    }

    const candidates: Array<{
        classId: string;
        startTime: Date;
        endTime: Date;
        room: string | null;
        lessonTopic: string | null;
    }> = [];

    const conflicts: Array<{
        date: string;
        reason: string;
    }> = [];

    // Duyệt qua từng ngày trong khoảng thời gian
    const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
    const limitDate = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59);

    while (cur <= limitDate) {
        const dayOfWeek = cur.getDay(); // 0: CN, 1: T2, ..., 6: T7
        if (validDays.includes(dayOfWeek)) {
            // Tính toán thời điểm UTC chuẩn dựa trên múi giờ client để không bị lệch giờ
            const startUtcMs = Date.UTC(cur.getFullYear(), cur.getMonth(), cur.getDate(), startH, startM, 0, 0) + (tzOffset * 60 * 1000);
            const endUtcMs = Date.UTC(cur.getFullYear(), cur.getMonth(), cur.getDate(), endH, endM, 0, 0) + (tzOffset * 60 * 1000);

            const sessionStart = new Date(startUtcMs);
            const sessionEnd = new Date(endUtcMs);

            // Kiểm tra xung đột với lịch đã có trong DB
            const conflictCheck = await checkScheduleConflict({
                classId: targetClass.classId,
                startTime: sessionStart,
                endTime: sessionEnd
            });

            if (conflictCheck.hasConflict) {
                if (!skipConflicts) {
                    throw new BadRequestError(`Trùng lịch vào ngày ${formatTimeVN(sessionStart)}: ${conflictCheck.reason}`);
                } else {
                    conflicts.push({
                        date: sessionStart.toISOString(),
                        reason: conflictCheck.reason || "Trùng lịch học hoặc giáo viên bận"
                    });
                }
            } else {
                candidates.push({
                    classId: targetClass.classId,
                    startTime: sessionStart,
                    endTime: sessionEnd,
                    room: typeof room === "string" && room.trim() ? room.trim() : null,
                    lessonTopic: typeof lessonTopic === "string" && lessonTopic.trim() ? lessonTopic.trim() : null
                });
            }
        }

        cur.setDate(cur.getDate() + 1);
    }

    if (candidates.length === 0) {
        if (conflicts.length > 0) {
            const firstReason = conflicts[0]?.reason ?? "Trùng lịch";
            throw new BadRequestError(`Không thể tạo lịch: Toàn bộ ${conflicts.length} buổi học dự kiến đều bị trùng lịch (${firstReason})`);
        }
        throw new BadRequestError("Không có ngày nào khớp với thứ đã chọn trong khoảng thời gian này");
    }

    // Lưu hàng loạt vào DB
    await prisma.schedule.createMany({
        data: candidates
    });

    res.status(201).send({
        message: `Đã tạo thành công ${candidates.length} buổi học định kỳ${conflicts.length > 0 ? ` (Bỏ qua ${conflicts.length} buổi bị trùng lịch)` : ''}.`,
        createdCount: candidates.length,
        skippedCount: conflicts.length,
        conflicts
    });
});

export { router as createRecurringSchedulesRouter };

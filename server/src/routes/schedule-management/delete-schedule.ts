import express from "express";
import type { Request, Response } from "express";
import { NotFoundError, BadRequestError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { getIntParam } from "./helpers.js";

const router = express.Router();

// Xóa một buổi học đơn lẻ
router.delete("/api/users/schedules/:scheduleId", [
    requireAdmin
], async (req: Request, res: Response) => {
    const scheduleId = getIntParam(req, "scheduleId");

    const existing = await prisma.schedule.findUnique({
        where: { scheduleId }
    });

    if (!existing) {
        throw new NotFoundError();
    }

    // Xóa bản ghi điểm danh phụ thuộc (nếu có) trước khi xóa buổi học
    await prisma.$transaction([
        prisma.attendanceRecord.deleteMany({
            where: { scheduleId }
        }),
        prisma.schedule.delete({
            where: { scheduleId }
        })
    ]);

    res.send({ message: "Đã xóa buổi học thành công", scheduleId });
});

// Xóa tất cả các buổi học của một lớp (hỗ trợ khi muốn reset lịch lớp)
router.delete("/api/users/schedules/by-class/:classId", [
    requireAdmin
], async (req: Request, res: Response) => {
    const classId = req.params.classId?.trim();
    if (!classId) {
        throw new BadRequestError("Thiếu mã lớp học");
    }

    // Lấy tất cả scheduleId của lớp
    const classSchedules = await prisma.schedule.findMany({
        where: { classId },
        select: { scheduleId: true }
    });

    const scheduleIds = classSchedules.map(s => s.scheduleId);

    if (scheduleIds.length > 0) {
        await prisma.$transaction([
            prisma.attendanceRecord.deleteMany({
                where: { scheduleId: { in: scheduleIds } }
            }),
            prisma.schedule.deleteMany({
                where: { scheduleId: { in: scheduleIds } }
            })
        ]);
    }

    res.send({ message: `Đã xóa ${scheduleIds.length} buổi học của lớp`, count: scheduleIds.length });
});

export { router as deleteScheduleRouter };


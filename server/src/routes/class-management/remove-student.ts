import express from "express";
import type { Request, Response } from "express";
import { NotFoundError, BadRequestError } from "@xen-tickets/common";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { getParam } from "./helpers.js";

const router = express.Router();

// ADMIN: đưa học sinh ra khỏi lớp / chuyển lớp / thôi học
// Query hoặc body param: action = 'TRANSFERRED' | 'DROPPED' | 'DELETE'
router.delete("/api/users/classes/:classId/students/:studentId", requireAdmin, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");
    const studentId = getParam(req, "studentId");

    const rawAction = (req.query.action as string) || (req.body?.action as string) || "TRANSFERRED";
    const action = rawAction.toUpperCase();

    const enrollment = await prisma.student_Class.findUnique({
        where: {
            studentId_classId: { studentId, classId }
        }
    });

    if (!enrollment) {
        throw new NotFoundError();
    }

    if (action === "TRANSFERRED") {
        // Chuyển lớp: Đánh dấu trạng thái lớp cũ là TRANSFERRED (bảo toàn lịch sử)
        // Học sinh này ngay lập tức có thể được thêm vào lớp học mới!
        const updated = await prisma.student_Class.update({
            where: {
                studentId_classId: { studentId, classId }
            },
            data: {
                status: EnrollmentStatus.TRANSFERRED
            }
        });
        return res.send(updated);
    }

    if (action === "DROPPED") {
        // Thôi học: Đánh dấu trạng thái là DROPPED (bảo toàn lịch sử)
        const updated = await prisma.student_Class.update({
            where: {
                studentId_classId: { studentId, classId }
            },
            data: {
                status: EnrollmentStatus.DROPPED
            }
        });
        return res.send(updated);
    }

    if (action === "DELETE") {
        // Xếp nhầm lớp: Kiểm tra nếu học sinh đã có dữ liệu điểm danh thì không cho xóa cứng
        const hasAttendance = await prisma.attendanceRecord.findFirst({
            where: {
                studentId,
                schedule: { classId }
            }
        });

        if (hasAttendance) {
            throw new BadRequestError(
                "Học sinh đã có dữ liệu điểm danh trong lớp này, không thể xóa vĩnh viễn. Vui lòng chọn 'Chuyển lớp' hoặc 'Thôi học'."
            );
        }

        await prisma.student_Class.delete({
            where: {
                studentId_classId: { studentId, classId }
            }
        });
        return res.send({});
    }

    throw new BadRequestError("Hành động không hợp lệ. Phải là TRANSFERRED, DROPPED hoặc DELETE.");
});

export { router as removeStudentRouter };

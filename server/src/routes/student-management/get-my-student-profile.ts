import express from "express";
import type { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, NotFoundError, BadRequestError } from "@xen-tickets/common";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";
import { requireStudent } from "../../middlewares/require-student.js";

const router = express.Router();

// HỌC SINH: Lấy thông tin cá nhân, lớp học hiện tại và lịch sử điểm danh
router.get("/api/users/students/me", requireStudent, async (req: Request, res: Response) => {
    const student = await prisma.student.findUnique({
        where: { userId: req.currentUser2!.userId },
        include: {
            enrollments: {
                where: { status: EnrollmentStatus.ACTIVE },
                include: {
                    class: {
                        include: {
                            homeroomTeacher: {
                                select: {
                                    teacherId: true,
                                    teacherName: true,
                                    email: true,
                                    phoneNumber: true
                                }
                            },
                            _count: {
                                select: {
                                    enrollments: {
                                        where: { status: EnrollmentStatus.ACTIVE }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            attendance: {
                include: {
                    schedule: {
                        include: {
                            class: {
                                select: {
                                    className: true,
                                    grade: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    recordedAt: "desc"
                }
            }
        }
    });

    if (!student) {
        throw new NotFoundError();
    }

    const activeClasses = student.enrollments.map((e) => ({
        classId: e.class.classId,
        className: e.class.className,
        grade: e.class.grade,
        maxStudents: e.class.maxStudents,
        status: e.class.status,
        startDate: e.class.startDate,
        endDate: e.class.endDate,
        homeroomTeacher: e.class.homeroomTeacher,
        currentStudentsCount: e.class._count.enrollments,
        joinDate: e.joinDate,
        enrollmentStatus: e.status
    }));
    const activeClass = activeClasses[0] || null;

    res.send({
        student: {
            studentId: student.studentId,
            studentName: student.studentName,
            dateOfBirth: student.dateOfBirth,
            phoneNumber: student.phoneNumber,
            email: student.email,
            gender: student.gender,
            address: student.address,
            userId: student.userId,
            username: req.currentUser2!.username
        },
        activeClass,
        activeClasses,
        attendance: student.attendance.map((rec) => ({
            id: rec.id,
            scheduleId: rec.scheduleId,
            status: rec.status,
            notes: rec.notes,
            recordedAt: rec.recordedAt,
            lessonTopic: rec.schedule.lessonTopic,
            room: rec.schedule.room,
            startTime: rec.schedule.startTime,
            endTime: rec.schedule.endTime,
            className: rec.schedule.class.className,
            grade: rec.schedule.class.grade
        }))
    });
});

// HỌC SINH: Cập nhật thông tin liên hệ của chính mình (SĐT, Email, Địa chỉ)
router.put(
    "/api/users/students/me",
    requireStudent,
    [
        body("email").optional().isEmail().withMessage("Email không hợp lệ"),
        body("phoneNumber").optional().trim().notEmpty().withMessage("Số điện thoại không được để trống"),
        body("address").optional().trim().notEmpty().withMessage("Địa chỉ không được để trống")
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const { email, phoneNumber, address } = req.body;

        const student = await prisma.student.findUnique({
            where: { userId: req.currentUser2!.userId }
        });

        if (!student) {
            throw new NotFoundError();
        }

        if (email && email !== student.email) {
            const existingEmail = await prisma.student.findFirst({
                where: { email, NOT: { studentId: student.studentId } }
            });
            if (existingEmail) {
                throw new BadRequestError("Email này đã được sử dụng bởi học sinh khác");
            }
        }

        const updateData: { email?: string; phoneNumber?: string; address?: string } = {};
        if (email !== undefined) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (address !== undefined) updateData.address = address;

        const updatedStudent = await prisma.student.update({
            where: { studentId: student.studentId },
            data: updateData
        });

        res.send(updatedStudent);
    }
);

export { router as getStudentProfileRouter };

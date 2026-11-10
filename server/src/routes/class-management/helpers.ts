import type { Request } from "express";
import { body } from "express-validator";
import { BadRequestError } from "@xen-tickets/common";
import { ClassStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";

export const GRADES = ["Khối 10", "Khối 11", "Khối 12"];

// Kèm thông tin GVCN và đếm sĩ số hiện tại qua Student_Class
export const classInclude = {
    homeroomTeacher: { select: { teacherId: true, teacherName: true } },
    _count: { select: { enrollments: true } }
} as const;

export const toClassDto = (c: any) => {
    const { _count, ...rest } = c;
    const statusMap: Record<string, string> = {
        ACTIVE: "Hoạt động",
        ARCHIVED: "Tạm ngưng",
        COMPLETED: "Đã hoàn thành"
    };
    return {
        ...rest,
        status: statusMap[rest.status] || rest.status,
        totalStudents: _count?.enrollments ?? 0
    };
};

export const getParam = (req: Request, name: string): string => {
    const value = req.params[name];
    if (!value) {
        throw new BadRequestError(`Thiếu tham số ${name}`);
    }
    return value;
};

export const parseClassStatus = (status: unknown): ClassStatus | undefined => {
    if (typeof status !== "string") return undefined;
    const trimmed = status.trim();
    if (trimmed === "Hoạt động" || trimmed === "ACTIVE") return ClassStatus.ACTIVE;
    if (trimmed === "Tạm ngưng" || trimmed === "ARCHIVED") return ClassStatus.ARCHIVED;
    if (trimmed === "Đã hoàn thành" || trimmed === "COMPLETED") return ClassStatus.COMPLETED;
    return undefined;
};

// Trả về teacherId hợp lệ hoặc null nếu chưa gán GVCN
export const resolveHomeroomTeacher = async (raw: unknown): Promise<string | null> => {
    const teacherId = typeof raw === "string" ? raw.trim() : "";
    if (!teacherId) return null;
    const teacher = await prisma.teacher.findUnique({ where: { teacherId } });
    if (!teacher) {
        throw new BadRequestError("Giáo viên chủ nhiệm không tồn tại");
    }
    return teacherId;
};

export const parseDate = (val: unknown): Date | null => {
    if (!val || typeof val !== "string" || !val.trim()) return null;
    const d = new Date(val.trim());
    return isNaN(d.getTime()) ? null : d;
};

export const classValidators = [
    body("className")
        .trim()
        .notEmpty()
        .withMessage("Tên lớp học không được để trống"),
    body("grade")
        .trim()
        .isIn(GRADES)
        .withMessage("Khối phải là Khối 10, Khối 11 hoặc Khối 12"),
    body("maxStudents")
        .isInt({ min: 1, max: 100 })
        .withMessage("Sĩ số tối đa phải là số nguyên từ 1 đến 100")
];


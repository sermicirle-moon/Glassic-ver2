import type { Request } from "express";
import { BadRequestError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";

export const scheduleInclude = {
    class: {
        include: {
            homeroomTeacher: {
                select: {
                    teacherId: true,
                    teacherName: true
                }
            }
        }
    }
} as const;

export const toScheduleDto = (s: any) => ({
    scheduleId: s.scheduleId,
    classId: s.classId,
    className: s.class?.className || "",
    grade: s.class?.grade || "",
    homeroomTeacherId: s.class?.homeroomTeacherId || null,
    homeroomTeacherName: s.class?.homeroomTeacher?.teacherName || null,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    room: s.room || null,
    lessonTopic: s.lessonTopic || null
});

export const formatTimeVN = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }) + ' ' + date.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit'
    });
};

export const parseDateParam = (val: unknown): Date | null => {
    if (!val || typeof val !== "string" || !val.trim()) return null;
    const d = new Date(val.trim());
    return isNaN(d.getTime()) ? null : d;
};

export const getIntParam = (req: Request, name: string): number => {
    const raw = req.params[name];
    if (!raw) {
        throw new BadRequestError(`Thiếu tham số ${name}`);
    }
    const num = parseInt(raw, 10);
    if (isNaN(num)) {
        throw new BadRequestError(`Tham số ${name} không hợp lệ`);
    }
    return num;
};

export interface ConflictCheckParams {
    classId: string;
    startTime: Date;
    endTime: Date;
    excludeScheduleId?: number;
}

export interface ConflictResult {
    hasConflict: boolean;
    reason?: string;
}

/**
 * Kiểm tra xung đột lịch:
 * 1. Không trùng giờ cho cùng một lớp học.
 * 2. Không trùng giờ cho cùng một giáo viên (dù dạy 2 lớp khác nhau).
 * 3. Cho phép nhiều lớp khác nhau học song song trong cùng 1 ca nếu khác giáo viên.
 */
export const checkScheduleConflict = async (
    params: ConflictCheckParams
): Promise<ConflictResult> => {
    const { classId, startTime, endTime, excludeScheduleId } = params;

    if (startTime >= endTime) {
        return {
            hasConflict: true,
            reason: "Thời gian bắt đầu phải trước thời gian kết thúc."
        };
    }

    const targetClass = await prisma.class.findUnique({
        where: { classId },
        include: { homeroomTeacher: true }
    });

    if (!targetClass) {
        return {
            hasConflict: true,
            reason: `Không tìm thấy lớp học với mã "${classId}".`
        };
    }

    const teacherId = targetClass.homeroomTeacherId;

    // Tìm các buổi học có khoảng thời gian giao nhau:
    // Điều kiện giao: existing.startTime < newEndTime AND existing.endTime > newStartTime
    const overlapping = await prisma.schedule.findMany({
        where: {
            ...(excludeScheduleId ? { scheduleId: { not: excludeScheduleId } } : {}),
            startTime: { lt: endTime },
            endTime: { gt: startTime },
            OR: [
                { classId: classId },
                ...(teacherId ? [{ class: { homeroomTeacherId: teacherId } }] : [])
            ]
        },
        include: scheduleInclude
    });

    if (overlapping.length > 0) {
        // Kiểm tra xem trùng lớp hay trùng giáo viên
        const classConflict = overlapping.find(s => s.classId === classId);
        if (classConflict) {
            return {
                hasConflict: true,
                reason: `Lớp "${targetClass.className}" đã có lịch học trong khung giờ này (${formatTimeVN(classConflict.startTime)} - ${formatTimeVN(classConflict.endTime)}${classConflict.lessonTopic ? ` - ${classConflict.lessonTopic}` : ''}).`
            };
        }

        const teacherConflict = overlapping.find(
            s => s.class?.homeroomTeacherId && s.class.homeroomTeacherId === teacherId
        );
        if (teacherConflict) {
            const teacherName = targetClass.homeroomTeacher?.teacherName || teacherConflict.class?.homeroomTeacher?.teacherName || "này";
            return {
                hasConflict: true,
                reason: `Giáo viên "${teacherName}" đã có lịch dạy lớp "${teacherConflict.class?.className || 'khác'}" trong khung giờ này (${formatTimeVN(teacherConflict.startTime)} - ${formatTimeVN(teacherConflict.endTime)}).`
            };
        }
    }

    return { hasConflict: false };
};


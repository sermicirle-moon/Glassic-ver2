import express from "express";
import type { Request, Response } from "express";
import { body } from "express-validator";
import { validateRequest, BadRequestError, NotFoundError, NotAuthorizedError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { requireTeacher } from "../../middlewares/require-teacher.js";

const router = express.Router();

const GRADES = ["Khối 10", "Khối 11", "Khối 12"];
const STATUSES = ["Hoạt động", "Tạm ngưng"];

// Kèm thông tin GVCN và đếm sĩ số hiện tại
const classInclude = {
    homeroomTeacher: { select: { teacherId: true, teacherName: true } },
    _count: { select: { students: true } }
} as const;

const toClassDto = <T extends { _count: { students: number } }>(c: T) => {
    const { _count, ...rest } = c;
    return { ...rest, totalStudents: _count.students };
};

const getParam = (req: Request, name: string): string => {
    const value = req.params[name];
    if (!value) {
        throw new BadRequestError(`Thiếu tham số ${name}`);
    }
    return value;
};

// Trả về teacherId hợp lệ hoặc null nếu chưa gán GVCN
const resolveHomeroomTeacher = async (raw: unknown): Promise<string | null> => {
    const teacherId = typeof raw === "string" ? raw.trim() : "";
    if (!teacherId) return null;
    const teacher = await prisma.teacher.findUnique({ where: { teacherId } });
    if (!teacher) {
        throw new BadRequestError("Giáo viên chủ nhiệm không tồn tại");
    }
    return teacherId;
};

const classValidators = [
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

// ADMIN: danh sách toàn bộ lớp học
router.get("/api/users/classes", requireAdmin, async (req: Request, res: Response) => {
    const classes = await prisma.class.findMany({
        orderBy: { classId: "asc" },
        include: classInclude
    });
    res.send(classes.map(toClassDto));
});

// TEACHER: các lớp mà giáo viên đang đăng nhập làm chủ nhiệm
router.get("/api/users/classes/my", requireTeacher, async (req: Request, res: Response) => {
    const teacher = await prisma.teacher.findUnique({
        where: { userId: req.currentUser2!.userId }
    });
    if (!teacher) {
        throw new NotFoundError();
    }
    const classes = await prisma.class.findMany({
        where: { homeroomTeacherId: teacher.teacherId },
        orderBy: { classId: "asc" },
        include: classInclude
    });
    res.send(classes.map(toClassDto));
});

// ADMIN hoặc GVCN của lớp: danh sách học sinh trong lớp
router.get("/api/users/classes/:classId/students", async (req: Request, res: Response) => {
    const user = req.currentUser2;
    if (!user) {
        throw new NotAuthorizedError();
    }
    const classId = getParam(req, "classId");
    const cls = await prisma.class.findUnique({
        where: { classId },
        include: { homeroomTeacher: { select: { userId: true } } }
    });
    if (!cls) {
        throw new NotFoundError();
    }

    const role = user.role?.toUpperCase();
    const isHomeroomTeacher = role === "TEACHER" && cls.homeroomTeacher?.userId === user.userId;
    if (role !== "ADMIN" && !isHomeroomTeacher) {
        throw new NotAuthorizedError();
    }

    const students = await prisma.student.findMany({
        where: { classId },
        orderBy: { studentId: "asc" }
    });
    res.send(students);
});

// ADMIN: tạo lớp học
router.post("/api/users/classes", [
    requireAdmin,
    body("classId")
        .trim()
        .notEmpty()
        .withMessage("Mã lớp không được để trống"),
    ...classValidators
], validateRequest, async (req: Request, res: Response) => {
    const { classId, className, grade, maxStudents } = req.body;

    const existing = await prisma.class.findUnique({ where: { classId } });
    if (existing) {
        throw new BadRequestError("Mã lớp đã tồn tại");
    }

    const homeroomTeacherId = await resolveHomeroomTeacher(req.body.homeroomTeacherId);

    const created = await prisma.class.create({
        data: { classId, className, grade, maxStudents: Number(maxStudents), homeroomTeacherId },
        include: classInclude
    });
    res.status(201).send(toClassDto(created));
});

// ADMIN: cập nhật lớp học (tên, khối, sĩ số tối đa, GVCN, trạng thái)
router.put("/api/users/classes/:classId", [
    requireAdmin,
    ...classValidators,
    body("status")
        .isIn(STATUSES)
        .withMessage("Trạng thái phải là Hoạt động hoặc Tạm ngưng")
], validateRequest, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");
    const { className, grade, maxStudents, status } = req.body;

    const existing = await prisma.class.findUnique({
        where: { classId },
        include: { _count: { select: { students: true } } }
    });
    if (!existing) {
        throw new NotFoundError();
    }
    if (Number(maxStudents) < existing._count.students) {
        throw new BadRequestError(
            `Sĩ số tối đa không được nhỏ hơn số học sinh hiện có (${existing._count.students})`
        );
    }

    const homeroomTeacherId = await resolveHomeroomTeacher(req.body.homeroomTeacherId);

    const updated = await prisma.class.update({
        where: { classId },
        data: { className, grade, maxStudents: Number(maxStudents), status, homeroomTeacherId },
        include: classInclude
    });
    res.send(toClassDto(updated));
});

// ADMIN: xóa lớp (chỉ khi lớp không còn học sinh)
router.delete("/api/users/classes/:classId", requireAdmin, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");

    const existing = await prisma.class.findUnique({
        where: { classId },
        include: { _count: { select: { students: true } } }
    });
    if (!existing) {
        throw new NotFoundError();
    }
    if (existing._count.students > 0) {
        throw new BadRequestError("Lớp vẫn còn học sinh, hãy chuyển học sinh ra khỏi lớp trước khi xóa");
    }

    await prisma.class.delete({ where: { classId } });
    res.send({});
});

// ADMIN: xếp học sinh vào lớp (kiểm tra sĩ số tối đa)
router.post("/api/users/classes/:classId/students", [
    requireAdmin,
    body("studentId")
        .trim()
        .notEmpty()
        .withMessage("Mã học sinh không được để trống")
], validateRequest, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");
    const { studentId } = req.body;

    const cls = await prisma.class.findUnique({
        where: { classId },
        include: { _count: { select: { students: true } } }
    });
    if (!cls) {
        throw new NotFoundError();
    }

    const student = await prisma.student.findUnique({ where: { studentId } });
    if (!student) {
        throw new BadRequestError("Học sinh không tồn tại");
    }
    if (student.classId === classId) {
        throw new BadRequestError("Học sinh đã thuộc lớp này");
    }
    if (cls._count.students >= cls.maxStudents) {
        throw new BadRequestError("Lớp đã đủ sĩ số tối đa");
    }

    const updated = await prisma.student.update({
        where: { studentId },
        data: { classId }
    });
    res.send(updated);
});

// ADMIN: đưa học sinh ra khỏi lớp
router.delete("/api/users/classes/:classId/students/:studentId", requireAdmin, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");
    const studentId = getParam(req, "studentId");

    const student = await prisma.student.findUnique({ where: { studentId } });
    if (!student || student.classId !== classId) {
        throw new NotFoundError();
    }

    await prisma.student.update({
        where: { studentId },
        data: { classId: null }
    });
    res.send({});
});

export { router as classManagementRouter };
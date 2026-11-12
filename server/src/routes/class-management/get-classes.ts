import express from "express";
import type { Request, Response } from "express";
import { NotFoundError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { requireTeacher } from "../../middlewares/require-teacher.js";
import { classInclude, toClassDto } from "./helpers.js";

const router = express.Router();

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

export { router as getClassesRouter };


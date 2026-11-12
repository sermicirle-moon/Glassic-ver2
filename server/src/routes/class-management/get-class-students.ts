import express from "express";
import type { Request, Response } from "express";
import { NotFoundError, NotAuthorizedError } from "@xen-tickets/common";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "../../service/prisma.js";
import { getParam } from "./helpers.js";

const router = express.Router();

// ADMIN hoặc GVCN của lớp: danh sách học sinh trong lớp (hỗ trợ lọc status: ACTIVE, COMPLETED, TRANSFERRED, DROPPED)
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

    const statusQuery = req.query.status as string | undefined;
    let statusFilter: EnrollmentStatus | undefined = undefined;
    if (statusQuery && Object.values(EnrollmentStatus).includes(statusQuery.toUpperCase() as EnrollmentStatus)) {
        statusFilter = statusQuery.toUpperCase() as EnrollmentStatus;
    }

    const enrollments = await prisma.student_Class.findMany({
        where: {
            classId,
            ...(statusFilter ? { status: statusFilter } : {})
        },
        include: { student: true },
        orderBy: [
            { status: "asc" },
            { student: { studentId: "asc" } }
        ]
    });

    const students = enrollments.map((e) => ({
        ...e.student,
        classId: e.classId,
        joinDate: e.joinDate,
        enrollmentStatus: e.status
    }));

    res.send(students);
});

export { router as getClassStudentsRouter };

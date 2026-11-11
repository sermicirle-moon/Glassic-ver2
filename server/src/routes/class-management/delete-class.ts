import express from "express";
import type { Request, Response } from "express";
import { BadRequestError, NotFoundError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { getParam } from "./helpers.js";

const router = express.Router();

// ADMIN: xóa lớp (chỉ khi lớp không còn học sinh)
router.delete("/api/users/classes/:classId", requireAdmin, async (req: Request, res: Response) => {
    const classId = getParam(req, "classId");

    const existing = await prisma.class.findUnique({
        where: { classId },
        include: { _count: { select: { enrollments: true } } }
    });
    if (!existing) {
        throw new NotFoundError();
    }
    if (existing._count.enrollments > 0) {
        throw new BadRequestError("Lớp vẫn còn học sinh, hãy chuyển học sinh ra khỏi lớp trước khi xóa");
    }

    await prisma.class.delete({ where: { classId } });
    res.send({});
});

export { router as deleteClassRouter };


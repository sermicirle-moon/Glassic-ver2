import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";

const router = express.Router();

router.get("/api/users/teachers", requireAdmin, async (req: Request, res: Response) => {
    const teachers = await prisma.teacher.findMany({
        orderBy: { teacherId: 'asc' }
    });
    res.send(teachers);
});

export { router as teacherManagementRouter };


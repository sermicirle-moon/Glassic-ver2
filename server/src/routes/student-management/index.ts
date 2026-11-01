import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";

const router = express.Router();

router.get("/api/users/students", requireAdmin, async (req: Request, res: Response) => {
    const students = await prisma.student.findMany({
        orderBy: { studentId: 'asc' }
    });
    res.send(students);
});

export { router as studentManagementRouter };


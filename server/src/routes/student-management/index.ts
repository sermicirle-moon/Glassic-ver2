import express from "express";
import type { Request, Response } from "express";
import { prisma } from "../../service/prisma.js";
import { requireAdmin } from "../../middlewares/require-admin.js";
import { NotFoundError } from "@xen-tickets/common";
import { getStudentsRouter } from "./get-students.js";
import { createStudentRouter } from "./create-student.js";

const router = express.Router();

router.use(getStudentsRouter);
router.use(createStudentRouter);

router.delete("/api/users/students/:studentId", requireAdmin, async (req: Request, res: Response) => {
    const { studentId } = req.params;   
    const existingStudent = await prisma.student.findUnique({
        where: { studentId: String(studentId) }
    });
    if(!existingStudent){
        throw new NotFoundError();
    }

    await prisma.student.delete({
        where: { studentId: String(studentId) }
    });
    res.status(204).send({});
});    

export { router as studentManagementRouter };

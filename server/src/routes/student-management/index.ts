import express from "express";
import { getStudentsRouter } from "./get-students.js";
import { createStudentRouter } from "./create-student.js";

const router = express.Router();

router.use(getStudentsRouter);
router.use(createStudentRouter);

export { router as studentManagementRouter };

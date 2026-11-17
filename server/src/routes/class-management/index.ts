import express from "express";
import { getClassesRouter } from "./get-classes.js";
import { createClassRouter } from "./create-class.js";
import { updateClassRouter } from "./update-class.js";
import { deleteClassRouter } from "./delete-class.js";
import { getClassStudentsRouter } from "./get-class-students.js";
import { assignStudentRouter } from "./assign-student.js";
import { removeStudentRouter } from "./remove-student.js";
import { completeClassRouter } from "./complete-class.js";

const router = express.Router();

router.use(getClassesRouter);
router.use(createClassRouter);
router.use(updateClassRouter);
router.use(deleteClassRouter);
router.use(getClassStudentsRouter);
router.use(assignStudentRouter);
router.use(removeStudentRouter);
router.use(completeClassRouter);

export { router as classManagementRouter };

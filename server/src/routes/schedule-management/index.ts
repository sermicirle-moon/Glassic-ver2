import express from "express";
import { getSchedulesRouter } from "./get-schedules.js";
import { createScheduleRouter } from "./create-schedule.js";
import { createRecurringSchedulesRouter } from "./create-recurring-schedules.js";
import { updateScheduleRouter } from "./update-schedule.js";
import { deleteScheduleRouter } from "./delete-schedule.js";

const router = express.Router();

router.use(getSchedulesRouter);
router.use(createScheduleRouter);
router.use(createRecurringSchedulesRouter);
router.use(updateScheduleRouter);
router.use(deleteScheduleRouter);

export { router as scheduleManagementRouter };


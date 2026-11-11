import express from "express";
import type { Request, Response } from "express";
import { NotAuthorizedError } from "@xen-tickets/common";
import { prisma } from "../../service/prisma.js";
import { scheduleInclude, toScheduleDto, parseDateParam } from "./helpers.js";

const router = express.Router();

router.get("/api/users/schedules", async (req: Request, res: Response) => {
    if (!req.currentUser2) {
        throw new NotAuthorizedError();
    }

    const { startDate, endDate, classId, teacherId } = req.query;

    const start = parseDateParam(startDate);
    const end = parseDateParam(endDate);

    const where: any = {};

    if (start && end) {
        where.AND = [
            { startTime: { lte: end } },
            { endTime: { gte: start } }
        ];
    } else if (start) {
        where.endTime = { gte: start };
    } else if (end) {
        where.startTime = { lte: end };
    }

    if (classId && typeof classId === "string" && classId.trim()) {
        where.classId = classId.trim();
    }

    if (teacherId && typeof teacherId === "string" && teacherId.trim()) {
        where.class = {
            homeroomTeacherId: teacherId.trim()
        };
    }

    const schedules = await prisma.schedule.findMany({
        where,
        include: scheduleInclude,
        orderBy: {
            startTime: "asc"
        }
    });

    res.send(schedules.map(toScheduleDto));
});

export { router as getSchedulesRouter };


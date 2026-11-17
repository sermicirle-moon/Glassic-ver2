import type { Request, Response, NextFunction } from 'express';
import { NotAuthorizedError } from '@xen-tickets/common';

export const requireTeacher = (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser2) {
        throw new NotAuthorizedError();
    }
    if (req.currentUser2.role?.toUpperCase() !== 'TEACHER') {
        throw new NotAuthorizedError();
    }
    next();
};
 
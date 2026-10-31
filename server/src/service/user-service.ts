import { randomBytes } from 'crypto';
import { BadRequestError } from '@xen-tickets/common';
import { prisma } from './prisma.js';

export class UserService {
    /**
     * Xác định hoặc tự sinh một userId ngẫu nhiên ngắn gọn (6 ký tự hex) và đảm bảo duy nhất
     */
    static async getOrGenerateUserId(customUserId?: string): Promise<string> {
        if (customUserId) {
            const existing = await prisma.user.findUnique({
                where: { userId: customUserId }
            });
            if (existing) {
                throw new BadRequestError("userId này đã tồn tại, vui lòng chọn userId khác");
            }
            return customUserId;
        }

        let uniqueId = randomBytes(3).toString('hex');
        while (await prisma.user.findUnique({ where: { userId: uniqueId } })) {
            uniqueId = randomBytes(3).toString('hex');
        }
        return uniqueId;
    }
}

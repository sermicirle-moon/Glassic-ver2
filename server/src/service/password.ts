import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class Password {
    static async toHash(password: string) {
        // Tăng độ dài salt lên 16 bytes (chuẩn OWASP)
        const salt = randomBytes(16).toString('hex');
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;

        return `${buf.toString('hex')}.${salt}`;
    }

    static async compare(storedPassword: string, suppliedPassword: string) {
        const [hashedPassword, salt] = storedPassword.split('.');
        if (!hashedPassword || !salt) {
            throw new Error('Định dạng mật khẩu lưu trữ không hợp lệ');
        }
        const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

        // Convert chuỗi hash gốc về Buffer để so sánh an toàn
        const storedHashBuffer = Buffer.from(hashedPassword, 'hex');

        // Dùng timingSafeEqual để chống Timing Attack
        return timingSafeEqual(buf, storedHashBuffer);
    }
}
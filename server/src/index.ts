import express from "express";
import { signupRouter } from "./routes/auth/signup.js";
import { errorHandler, NotFoundError } from '@xen-tickets/common';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use(signupRouter);

app.all('*', async (req, res) => {
    throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL must be defined');
    }

    try {
        await prisma.$connect();
        console.log("Đã kết nối thành công tới Database!");
        
        app.listen(3000, () => {
            console.log("Server đang lắng nghe trên port 3000!");
        });
    } catch (err) {
        console.error("Lỗi kết nối Database:", err);
        process.exit(1); 
    }
}

start();
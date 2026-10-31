import express from "express";
import 'express-async-errors';
import cookieSession from "cookie-session";
import { errorHandler, NotFoundError, currentUser2 } from '@xen-tickets/common';
import { prisma } from './service/prisma.js';

import { signupRouter } from "./routes/auth/signup.js";
import { signinRouter } from "./routes/auth/signin.js";
import { signoutRouter } from "./routes/auth/signout.js";
import { currentUserRouter } from "./routes/auth/current-user.js";

const app = express();

// Tin tưởng proxy (Nginx Ingress Controller)
app.set('trust proxy', true);

app.use(express.json());

// Cấu hình cookie-session để lưu trữ JWT
app.use(
    cookieSession({
        signed: false,
        secure: false // Hoạt động tốt cả HTTP/HTTPS và Postman
    })
);

// Middleware giải mã JWT từ session thành req.currentUser2
app.use(currentUser2);

// Đăng ký các routes auth
app.use(signupRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(currentUserRouter);

app.all('*', async (req, res) => {
    throw new NotFoundError();
});

app.use(errorHandler);

const start = async () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL must be defined');
    }
    if (!process.env.JWT_KEY) {
        throw new Error('JWT_KEY must be defined');
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

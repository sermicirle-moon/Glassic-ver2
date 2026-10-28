import express from "express";
import { signupRouter } from "./routes/auth/signup.js";
import { errorHandler } from "@xen-tickets/common";

const app = express();
app.use(express.json());

app.use(signupRouter);

app.use(errorHandler);

app.listen(3000, ()=>{
    console.log("Listening on port 3000!!!!!!!!");
})
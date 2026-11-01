import express from "express";
import { currentUser2 } from "@xen-tickets/common";

const router = express.Router();

router.get("/api/users/currentuser", currentUser2, (req, res) => {
  res.send({ currentUser: req.currentUser2 || null });
});

export { router as currentUserRouter };

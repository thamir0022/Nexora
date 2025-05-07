import {Router} from "express";
import { verifyUser } from "../utils/verifyUser.js";

const router = Router();

router.get("/", verifyUser, (req, res, next) => {
  res.send("Test api");
})

export default router;
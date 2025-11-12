import { Router } from "express";
import { registerUser } from "../controllers/user.controller";

const router = Router();

router.route("/api/v1/users").post(registerUser)


export default router;
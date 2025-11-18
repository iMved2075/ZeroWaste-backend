import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { createNewListing } from "../controllers/listing.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/createListing").post(verifyJWT, upload.array("foodPhotos", 5), createNewListing);
export default router;
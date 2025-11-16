import { Router } from "express";
import { changePassword, currentUser, deleteUser, loginUser, logoutUser, registerUser, updateAvatar, updateCoverImage, updateUserDetails } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser);

//secured routes


router.route("/changePassword").post(verifyJWT, changePassword);
router.route("/updateDetails").post(verifyJWT, updateUserDetails);
router.route("/currentUser").get(verifyJWT,currentUser);
router.route("/updateAvatar").post(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/updateCoverImage").post(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/deleteUser").delete(verifyJWT, deleteUser);
router.route("/logout").post(verifyJWT , logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
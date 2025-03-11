import { Router } from "express";
import {
  changePassword,
  getCurrentUser,
  getUserChannel,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  subscribeChannel,
  updateAvatar,
  updateCoverImg,
  updateUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/get-user").post(verifyJWT, getCurrentUser);
router.route("/update-user").post(verifyJWT, updateUser);
router
  .route("/update-avatar")
  .post(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover-img")
  .post(verifyJWT, upload.single("coverImage"), updateCoverImg);
router.route("/get-channel").post(verifyJWT, getUserChannel);
router.route("/subscribe-channel").post(verifyJWT, subscribeChannel);
export default router;

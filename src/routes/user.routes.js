import { Router } from "express";
import {
  changePassword,
  getCurrentUser,
  getUserChannel,
  getWatchHistory,
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
router.route("/c/:username").get(getUserChannel);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(verifyJWT, refreshAccessToken);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/get-user").get(verifyJWT, getCurrentUser);
router.route("/update-user").patch(verifyJWT, updateUser);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover-img")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImg);
router.route("/history").get(verifyJWT, getWatchHistory);
router.route("/subscribe-channel").post(verifyJWT, subscribeChannel);

export default router;

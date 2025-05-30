import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  uploadVideo,
  generateAiDescription,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/")
  .get(getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      {
        name: "video",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    uploadVideo,
  );

router.route("/v/:videoId").get(getVideoById).delete(verifyJWT, deleteVideo);
// .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/generate-ai-desc").get(verifyJWT, generateAiDescription);

export default router;

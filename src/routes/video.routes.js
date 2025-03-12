import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getAllVideos, uploadVideo } from "../controllers/video.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

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

export default router;

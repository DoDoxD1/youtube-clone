import { Router } from "express";
import {
  addCategory,
  getAllCategories,
  modifyCategory,
  removeCategory,
} from "../controllers/category.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/all").get(getAllCategories);
router.route("/add").post(verifyAdmin, addCategory);
router.route("/remove").delete(verifyAdmin, removeCategory);
router.route("/modify").patch(verifyAdmin, modifyCategory);

export default router;

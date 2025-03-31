import { Router } from "express";
import {
  addCategory,
  getAllCategories,
  modifyCategory,
  removeCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.route("/all").get(getAllCategories);
router.route("/add").post(addCategory);
router.route("/remove").delete(removeCategory);
router.route("/modify").patch(modifyCategory);

export default router;

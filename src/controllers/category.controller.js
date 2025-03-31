import { asyncHandler } from "../utils/asyncHandler.js";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  if (!categories) throw new ApiError(404, "Categories not found!");

  res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully!"));
});

const addCategory = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title || title === "") throw new ApiError(400, "Category name required");

  const createCategory = await Category.create({
    title,
  });

  const category = await Category.findById(createCategory?._id);

  if (!category) throw new ApiError(500, "Unable to create a new category!");

  res
    .status(200)
    .json(new ApiResponse(200, category, "Category created successfully!"));
});

const removeCategory = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title || title === "") throw new ApiError(400, "Category name required");

  const removeCategory = await Category.findOneAndDelete({
    title,
  });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Category removed successfully!"));
});

const modifyCategory = asyncHandler(async (req, res) => {
  const { oldTitle, title } = req.body;
  if (!oldTitle || oldTitle === "")
    throw new ApiError(400, "Old Category name required");
  if (!title || title === "") throw new ApiError(400, "Category name required");

  const updateCategory = await Category.findOneAndUpdate(
    { title: oldTitle },
    {
      $set: {
        title,
      },
    },
  );

  const category = await Category.findById(updateCategory?._id);
  if (!category)
    throw new ApiError(500, "Error occured while updating the category name!");

  res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully!"));
});

export { getAllCategories, addCategory, removeCategory, modifyCategory };

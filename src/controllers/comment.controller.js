import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// helper functions
const isUserOwner = (userId, ownerId) => {
  return new mongoose.Types.ObjectId(`${userId}`).equals(
    new mongoose.Types.ObjectId(`${ownerId}`),
  );
};

// route functions
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  //check video exists in db
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "Video doesn't exists!");

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(`${video?._id}`),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ])
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  if (!comments)
    throw new ApiError(500, "Error occured while fetching comments!");

  const count = await Comment.countDocuments();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
      "Comments fetched successfully!",
    ),
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { comment } = req.body;
  if (!comment || comment === "") throw new ApiError(400, "Comment required!");

  //check video exists in db
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "Video doesn't exists!");

  const createComment = await Comment.create({
    owner: req.user?._id,
    video: videoId,
    content: comment,
  });

  const newComment = await Comment.findById(createComment?._id);
  if (!newComment)
    throw new ApiError(500, "Error occurred while creating comment!");

  res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment successfully!"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!content || content === "")
    throw new ApiError(400, "Comment content could not be empty!");
  if (!commentId || !isValidObjectId(commentId))
    throw new ApiError(400, "Comment Id required!");

  //check comment exists in db
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(400, "Comment doesn't exists!");

  //check user is owner of comment
  if (!isUserOwner(req.user?._id, comment.owner))
    throw new ApiError(400, "Only owner can update comment!");

  const updateRes = await Comment.findByIdAndUpdate(comment?._id, {
    $set: {
      content,
    },
  });

  if (!updateRes)
    throw new ApiError(500, "Error occurred while updating comment!");

  const newComment = await Comment.findById(updateRes?._id);

  res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment updated successfully!"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId))
    throw new ApiError(400, "Comment Id required!");

  //check comment exists in db
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(400, "Comment doesn't exists!");

  //check user is owner of comment
  if (!isUserOwner(req.user?._id, comment.owner))
    throw new ApiError(400, "Only owner can delete comment!");

  const delComment = await Comment.findByIdAndDelete(commentId);

  if (!delComment)
    throw new ApiError(500, "Error occurred while deleting comment!");

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully!"));
});

export { getVideoComments, addComment, updateComment, deleteComment };

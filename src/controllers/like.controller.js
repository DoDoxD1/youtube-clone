import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  // check video is in db
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "Video not found!");

  // check video is liked by current user
  const userId = req.user?._id;
  const like = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(`${videoId}`),
      },
    },
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(`${userId}`),
      },
    },
  ]);

  // toggle the like
  if (like.length !== 0) {
    const deleteLike = await Like.findByIdAndDelete(like[0]?._id);
    if (!deleteLike) throw new ApiError(400, "Unable to unlike the video!");
    return res.status(200).json(new ApiResponse(200, {}, "Video unliked!"));
  } else {
    const newLike = await Like.create({
      likedBy: userId,
      video: videoId,
    });
    if (!newLike) throw new ApiError(400, "Unable to like the video!");
    return res.status(200).json(new ApiResponse(200, {}, "Video liked!"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid comment id");

  // check comment is in db
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(400, "Comment not found!");

  // check comment is liked by current user
  const userId = req.user?._id;
  const like = await Like.aggregate([
    {
      $match: {
        comment: new mongoose.Types.ObjectId(`${commentId}`),
      },
    },
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(`${userId}`),
      },
    },
  ]);

  // toggle the like
  if (like.length !== 0) {
    const deleteLike = await Like.findByIdAndDelete(like[0]?._id);
    if (!deleteLike) throw new ApiError(400, "Unable to unlike the comment!");
    return res.status(200).json(new ApiResponse(200, {}, "Comment unliked!"));
  } else {
    const newLike = await Like.create({
      likedBy: userId,
      comment: commentId,
    });
    if (!newLike) throw new ApiError(400, "Unable to like the comment!");
    return res.status(200).json(new ApiResponse(200, {}, "Comment liked!"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");

  // check tweet is in db
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(400, "tweet not found!");

  // check tweet is liked by current user
  const userId = req.user?._id;
  const like = await Like.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(`${tweetId}`),
      },
    },
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(`${userId}`),
      },
    },
  ]);

  // toggle the like
  if (like.length !== 0) {
    const deleteLike = await Like.findByIdAndDelete(like[0]?._id);
    if (!deleteLike) throw new ApiError(400, "Unable to unlike the tweet!");
    return res.status(200).json(new ApiResponse(200, {}, "Tweet unliked!"));
  } else {
    const newLike = await Like.create({
      likedBy: userId,
      tweet: tweetId,
    });
    if (!newLike) throw new ApiError(400, "Unable to like the tweet!");
    return res.status(200).json(new ApiResponse(200, {}, "Tweet liked!"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const likes = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(`${userId}`),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    coverImage: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);

  if (!likes) throw new ApiError(400, "Unable to fetch liked videos");

  // push the video object from likes to an array
  let likedVideos = [];
  likes.forEach((like) => {
    likedVideos.push(like?.video[0]);
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully!"),
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

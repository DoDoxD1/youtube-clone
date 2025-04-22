import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // get total number of views on the channel
  const userId = new mongoose.Types.ObjectId(`${req.user?._id}`);
  const totalViews = await Video.aggregate([
    {
      $match: {
        owner: userId,
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$views",
        },
      },
    },
  ]);

  // get total number of videos
  const totalVideos = await Video.countDocuments({ owner: userId });

  // get subscriber count
  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });

  //get total number of tweets
  const totalTweets = await Tweet.countDocuments({ owner: userId });

  // get total number of likes on videos
  const totalLike = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $unwind: {
        path: "$video",
      },
    },
    {
      $addFields: {
        owner: "$video.owner",
      },
    },
    {
      $match: {
        owner: userId,
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalViews: totalViews[0]?.total || 0,
        totalLikes: totalLike[0]?.count || 0,
        totalSubscribers,
        totalTweets,
      },
      "Stats fetched successfully!",
    ),
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(`${req.user?._id}`);
  // Parse query parameters with defaults
  const limit = parseInt(req.query.limit) || 10;
  const cursorId = req.query.cursor; // The ID of the last item from previous page
  const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

  // Build query based on cursor
  const query = {};
  if (cursorId) {
    // If sorting in descending order (newest first)
    if (sortOrder === -1) {
      query._id = { $lt: new mongoose.Types.ObjectId(`${cursorId}`) };
    } else {
      // If sorting in ascending order (oldest first)
      query._id = { $gt: new mongoose.Types.ObjectId(`${cursorId}`) };
    }
  }

  const videos = await Video.aggregate([
    { $match: query },
    { $sort: { _id: sortOrder } },
    { $limit: limit + 1 }, // Get one extra to check if there's more
    {
      $lookup: {
        from: "categories", // The name of your categories collection
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $addFields: {
        category: {
          $arrayElemAt: ["$category.title", 0],
        },
      },
    },
    {
      $project: {
        categoryData: 0, // Remove the intermediate array field
      },
    },
  ]);
  if (!videos) throw new ApiError(404, "Videos not found");

  // Check if there are more results
  const hasMore = videos.length > limit;
  const results = hasMore ? videos.slice(0, limit) : videos;

  // remove extra video
  videos.pop();

  // Get the new cursor (ID of the last item)
  const nextCursor = hasMore ? results[results.length - 1]._id : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: videos,
        pagination: {
          nextCursor,
          hasMore,
        },
      },
      "Videos fetched successfully!",
    ),
  );
});

const getChannelVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || videoId === "") throw new ApiError(400, "Video Id required");

  const videoObj = await Video.findById(videoId);
  if (!videoObj.owner.equals(req.user._id)) {
    throw new ApiError(400, "User is not the owner of video");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(`${videoId}`),
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
  ]);
  if (!video) throw new ApiError(404, "Video not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully!"));
});

export { getChannelStats, getChannelVideos, getChannelVideo };

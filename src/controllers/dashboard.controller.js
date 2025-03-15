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
  const videos = await Video.find({
    owner: userId,
  });
  if (!videos)
    throw new ApiError(400, "Error occured while loading the videos!");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully!"));
});

export { getChannelStats, getChannelVideos };

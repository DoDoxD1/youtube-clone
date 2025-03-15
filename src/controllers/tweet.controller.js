import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// helper function
const isUserOwner = (userId, ownerId) => {
  return new mongoose.Types.ObjectId(`${userId}`).equals(
    new mongoose.Types.ObjectId(`${ownerId}`),
  );
};

// route functions
const createTweet = asyncHandler(async (req, res) => {
  const owner = req.user?._id;

  // get content from request body
  const { content } = req.body;
  if (!content || content === "")
    throw new ApiError(400, "Tweet content is missing");

  // create a new tweet
  const tweet = await Tweet.create({
    owner,
    content,
  });

  if (!tweet) throw new ApiError(500, "Error occured while creating the tweet");

  // fetch and return newly created tweet
  const newTweet = await Tweet.findById(tweet?._id);
  if (!newTweet) throw new ApiError(404, "Tweet not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweeted successfully!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found!");

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(`${userId}`),
      },
    },
  ]);

  if (!tweets) throw new ApiError(500, "Unable to fetch tweets");

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweet fetched successfully!"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId))
    throw new ApiError(400, "Tweet id not found or is not valid!");

  const { content } = req.body;
  if (!content || content === "")
    throw new ApiError(400, "Provide content to update!");

  //check tweet is present in db
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found!");

  // check user is owner of tweet
  if (!isUserOwner(userId, tweet?.owner))
    throw new ApiError(400, "Only owner can modify tweet!");

  const update = await Tweet.findByIdAndUpdate(tweet?._id, {
    $set: {
      content,
    },
  });
  if (!update)
    throw new ApiError(500, "Error occured while updating the tweet!");

  const newTweet = await Tweet.findById(update?._id);
  if (!newTweet) throw new ApiError(404, "Updated tweet not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweet updated successfully!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId))
    throw new ApiError(400, "Tweet id not found or is not valid!");

  //check tweet is present in db
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found!");

  // check user is owner of tweet
  if (!isUserOwner(userId, tweet?.owner))
    throw new ApiError(400, "Only owner can modify tweet!");

  const deleteRes = await Tweet.findByIdAndDelete(tweet?._id);
  if (!deleteRes)
    throw new ApiError(5000, "Error occured while deleting the tweet!");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted succesfully!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

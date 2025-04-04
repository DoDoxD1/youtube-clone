import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import { isImage, isVideo } from "../validators/video.validator.js";
import OpenAI, { APIError } from "openai";

const getAllVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find();
  if (!videos) throw new ApiError(404, "Videos not found");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully!"));
});

const uploadVideo = asyncHandler(async (req, res) => {
  //user should be login to upload the video
  const owner = req.user?._id;
  if (!owner) throw new ApiError(400, "Unauthorised request!");

  // get details from req body
  const { title, description, isPublished } = req.body;

  if (!title || title === "") throw new ApiError(400, "Title can't be empty");
  if (!description || description === "")
    throw new ApiError(400, "Description can't be empty");

  // get video file from multer middleware
  if (
    !(req.files && Array.isArray(req.files.video) && req.files.video.length > 0)
  )
    throw new ApiError(400, "Video file required");

  // if file is present get the path
  const videoLocalPath = req.files?.video[0]?.path;

  // check the file format for video
  if (!isVideo(videoLocalPath))
    throw new ApiError(
      400,
      "Video File should be of type: '.mpg', '.mp2', '.mpeg', '.mpe', '.mpv', '.mp4'",
    );

  // get thumbnail file from multer middleware
  if (
    !(
      req.files &&
      Array.isArray(req.files.thumbnail) &&
      req.files.thumbnail.length > 0
    )
  )
    throw new ApiError(400, "thumbnail file required");

  // if file is present get the path
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  // check the file format for thumbnail
  if (!isImage(thumbnailLocalPath))
    throw new ApiError(
      400,
      "Thumbnail File should be of type: '.gif', '.jpg', '.jpeg', '.png'",
    );

  // upload video and thumbnail to the cloudinary
  const videoFile = await uploadOnCloudinary(videoLocalPath);
  if (!videoFile)
    throw new ApiError(500, "Error while uploading video file to cloud");
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail)
    throw new ApiError(500, "Error while uploading thumbnail to cloud");

  // create a video object
  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner,
    title,
    description,
    isPublished: isPublished || false,
    duration: videoFile.duration,
  });

  // fetch newly created video
  const newVideo = await Video.findById(video._id);

  if (!newVideo)
    throw new ApiError(500, "Something went wrong while uploading video");

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, newVideo, "Video uploaded successfully!"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || videoId === "") throw new ApiError(400, "Video Id required");

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

const deleteVideo = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { videoId } = req.params;
  if (!videoId || videoId === "") throw new ApiError(400, "Video Id required");

  // check if user is the owner of the video
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "Video not found!");

  if (!userId.equals(video?.owner))
    throw new ApiError(400, "Only the author/publisher can delete the video");

  // delete the video from cloudinary
  const deleteVideoFile = await deleteFromCloudinary(video.videoFile, "video");
  const deleteThumbnail = await deleteFromCloudinary(video.thumbnail, "image");

  if (!deleteVideoFile || !deleteThumbnail)
    throw new ApiError(
      500,
      "Problem occured while deleting the assets from cloudinary",
    );

  // delete video from the db
  const deleteVideo = await Video.findByIdAndDelete(videoId);
  if (!deleteVideo)
    throw new ApiError(500, "Problem occured while deleting the video!x");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { videoId } = req.params;
  if (!videoId || videoId === "") throw new ApiError(400, "Video Id required");

  // check if user is the owner of the video
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(400, "Video not found!");

  if (!userId.equals(video?.owner))
    throw new ApiError(400, "Only the author/publisher can edit the video");

  // get new details
  let { title, description } = req.body;
  //if new details are empty set old
  if (!title || title === "") title = video.title;
  if (!description || description === "") description = video.description;

  let thumbnailLocalPath = req.file?.path;
  let thumbnail = null;
  if (thumbnailLocalPath || thumbnailLocalPath !== "") {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const response = await deleteFromCloudinary(video.thumbnail, "image");
  }

  const newVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url || video.thumbnail,
      },
    },
    { new: true },
  );

  if (!newVideo) throw new ApiError(404, "Video not found");

  res.status(200).json(new ApiResponse(200, newVideo, "Video updated"));
});

const generateAiDescription = asyncHandler(async (req, res) => {
  const { videoTitle } = req.body;

  if (!videoTitle || videoTitle === "")
    throw new APIError(400, "VideoTitle is required.");

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = openai.chat.completions.create({
    model: "gpt-4o-mini",
    store: true,
    messages: [
      {
        role: "user",
        content: `You are a professional YouTube content strategist and SEO expert. Based on the video title provided, generate a highly engaging, SEO-optimized YouTube video description. The description should:
  
  ✅ Include relevant keywords naturally for YouTube search optimization
  ✅ Encourage viewers to like, comment, and subscribe
  ✅ Include hashtags related to the video content
  ✅ Summarize the video in a way that maximizes watch time and CTR (Click-Through Rate)
  ✅ Be written in a conversational, audience-friendly tone
  ✅ Include a call-to-action to watch till the end
  ✅ Ensure it aligns with the YouTube algorithm's best practices for discoverability and ranking
  ✅ Answer directly without any description tag or heading
  
  Video Title: ${videoTitle}
  
  Your Output: A complete, ready-to-use YouTube video description optimized for SEO and maximum reach.`,
      },
    ],
  });

  completion
    .then((result) => {
      let description = result.choices[0].message.content;
      description = description.replaceAll(/\n/g, "\n");
      description = description.replaceAll("**", "");
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            description,
            "Description fetched successfully!",
          ),
        );
    })
    .catch((e) => {
      throw new ApiError(400, "Error occured while openAI Api call", e);
    });
});

const uploadMockVideo = asyncHandler(async (req, res) => {
  //user should be login to upload the video
  const owner = req.user?._id;
  if (!owner) throw new ApiError(400, "Unauthorised request!");

  // get details from req body
  let { title, isPublished } = req.body;

  if (!title || title === "") title = "Untitled";

  // create a video object
  const video = await Video.create({
    videoFile: "zz",
    thumbnail: "x",
    owner,
    title,
    isPublished: isPublished || false,
    duration: 100,
  });

  // fetch newly created video
  const newVideo = await Video.findById(video._id);

  if (!newVideo)
    throw new ApiError(500, "Something went wrong while uploading video");

  // return response
  return res
    .status(200)
    .json(new ApiResponse(200, newVideo, "Video uploaded successfully!"));
});

export {
  getAllVideos,
  uploadVideo,
  getVideoById,
  deleteVideo,
  updateVideo,
  generateAiDescription,
  uploadMockVideo,
};

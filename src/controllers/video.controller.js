import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { isImage, isVideo } from "../validators/video.validator.js";

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

export { getAllVideos, uploadVideo };

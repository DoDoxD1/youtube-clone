import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  // get name and decription
  const { name, description } = req.body;

  // get owner id of the playlist
  const ownerId = req.user?._id;

  // get  video array to add in the playlist
  const { videos } = req.body;

  // check each video is present in db
  if (!videos || videos.length === 0)
    throw new ApiError(
      400,
      "At least one video required to create a new playlist",
    );
  videos.forEach(async (videoId) => {
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
    const vid = await Video.findById(videoId);
    if (!vid) throw new ApiError(400, "One of the video not found");
  });

  // create playlist object
  const playlist = await Playlist.create({
    name: name || "Untitled",
    description: description || "",
    owner: ownerId,
    videos,
  });

  // fetch new playlist and then return playlist object as res
  const newPlaylist = await Playlist.findById(playlist._id);
  if (!newPlaylist)
    throw new ApiError(500, "Error while creating the playlist");
  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist created successfully!"));
});
const getUserPlaylists = asyncHandler(async (req, res) => {});
const getPlayListById = asyncHandler(async (req, res) => {});
const updatePlaylist = asyncHandler(async (req, res) => {});
const deletePlaylist = asyncHandler(async (req, res) => {});
const addVideoToPlaylist = asyncHandler(async (req, res) => {});
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {});

export {
  createPlaylist,
  getUserPlaylists,
  getPlayListById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
};

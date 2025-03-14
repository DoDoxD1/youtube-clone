import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// helper functions
const getPlaylist = async (playlistId) => {
  return await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(`${playlistId}`),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
        ],
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
  ]);
};

const isVideoInPlaylist = (videos, videoId) => {
  return videos.includes(videoId);
};

const isUserOwner = (userId, ownerId) => {
  return new mongoose.Types.ObjectId(`${userId}`).equals(
    new mongoose.Types.ObjectId(`${ownerId}`),
  );
};

// route functions
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

const getUserPlaylists = asyncHandler(async (req, res) => {
  // get user id
  const userId = req.user?._id;

  // fetch all the playlist of user
  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(`${userId}`),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
        ],
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
  ]);

  // if  playlists are fetched return
  if (!playlists) throw new ApiError(400, "Unable to get playlist for user");
  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched Successfully!"));
});

const getPlayListById = asyncHandler(async (req, res) => {
  // get playlist id
  const { playlistId } = req.params;
  if (!playlistId || playlistId === "")
    throw new ApiError(400, "Playlist Id required");

  if (!isValidObjectId(playlistId))
    throw new ApiError(401, "Inavlid playlist id");

  // fetch playlist from db
  const playlist = await getPlaylist(playlistId);

  // TODO: /refresh playlist refresPlaylist(playlist.videos) // checks for each video is present in db

  if (!playlist) throw new ApiError(404, "Playlist not found!");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully!"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  // get the playlist
  const { playlistId } = req.params;
  if (!playlistId || playlistId === "")
    throw new ApiError(400, "Playlist id is required");
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist id");

  // check if playlist exists in db
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found!");

  // check if user is the owner of playlist
  const user = req.user;
  if (!isUserOwner(user?._id, playlist.owner)) {
    throw new ApiError(400, "Only owner can modify the playlist!");
  }

  // get new title and description from the req body
  const { name, description } = req.body;
  // console.log(req);
  if (!name && !description) {
    throw new ApiError(
      400,
      "Provide atleast one parameter(name/description) to update",
    );
  }

  // update playlist and return
  const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist._id, {
    $set: {
      name: name === "" ? "Untitled" : name,
      description,
    },
  });

  const newPlaylist = await getPlaylist(updatedPlaylist._id);

  if (!newPlaylist) throw new ApiError(500, "Unable to update playlist");

  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, "Playlist updated successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // get the playlist id
  const { playlistId } = req.params;
  if (!playlistId) throw new ApiError(400, "Playlist id not found");
  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Provide a valid playlist id");

  // check if playlist exists in db
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found!");

  //check if user is owner
  const user = req.user;
  if (!isUserOwner(user?._id, playlist.owner)) {
    throw new ApiError(400, "Only owner can modify the playlist!");
  }

  const deletedResult = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedResult) throw new ApiError(400, "Unable to delete playlist");

  return res.status(200).json(new ApiResponse(200, {}, "Deletion successfull"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  // check if playlist exists in db
  if (!playlistId || !isValidObjectId(playlistId))
    throw new ApiError(400, "Provide a valid playlist id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found!");

  //check if user is owner
  const user = req.user;
  if (!isUserOwner(user?._id, playlist.owner)) {
    throw new ApiError(400, "Only owner can modify the playlist!");
  }

  // check if video exists in db
  if (!videoId || !isValidObjectId(videoId))
    throw new ApiError(400, "Provide a valid video id");
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found!");

  // check if video is already present in the playlist
  const videos = playlist.videos;
  if (isVideoInPlaylist(videos, videoId))
    throw new ApiError(400, "Video already present in the playlist!");

  // push the video to playlist
  const result = await Playlist.findByIdAndUpdate(playlistId, {
    $push: {
      videos: video._id,
    },
  });
  if (!result) throw new ApiError(400, "Unable to update the playlsit");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist updated successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;

  // check if playlist exists in db
  if (!playlistId || !isValidObjectId(playlistId))
    throw new ApiError(400, "Provide a valid playlist id");

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found!");

  //check if user is owner
  const user = req.user;
  if (!isUserOwner(user?._id, playlist.owner)) {
    throw new ApiError(400, "Only owner can modify the playlist!");
  }

  // check if video exists in db
  if (!videoId || !isValidObjectId(videoId))
    throw new ApiError(400, "Provide a valid video id");
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found!");

  // check if video is already present in the db
  const videos = playlist.videos;
  if (!isVideoInPlaylist(videos, videoId))
    throw new ApiError(400, "Video is not present in the playlist!");

  // push the video to playlist
  const result = await Playlist.findByIdAndUpdate(playlistId, {
    $pull: {
      videos: video._id,
    },
  });
  if (!result) throw new ApiError(400, "Unable to update the playlsit");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlayListById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
};

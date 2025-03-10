import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validateUserFields,
  validateEmail,
} from "../validators/user.validator.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const options = {
  httpOnly: true,
  secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { fullName, email, username, password } = req.body;

  // validation - no empty and formatting
  validateUserFields([fullName, email, username, password]);
  validateEmail(email);

  // check if user already exist
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // check for avatar and coverimage from multer
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath = null;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) throw new ApiError(400, "Avatar image is required");

  // upload files to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) throw new ApiError(400, "Avatar image is required");

  // create user object - create entry in mongodb
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // fetch newly created user from the db and remove password and refresh token from response
  // here we can also check above "user" if it is null but this method(to fetch new user by id) is better
  const newUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  // is user exists return response
  if (!newUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, newUser, "User registered Successfully"));
});

const generateTokens = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Unable to generate refresh and access tokens: ",
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //get the fields from the request
  const { username, email, password } = req.body;

  // validation - no empty and formatting
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }
  validateUserFields([password]); // check if password is empty string

  //find if user is there in the db (using email or username)
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new ApiError(404, "User not found!");

  //check if password is correct
  const isPasswordValidated = await user.isPasswordCorrect(password);
  if (!isPasswordValidated) throw new ApiError(401, "Password does not match!");

  //generate access token and refresh tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  //send tokens as cookies to the user
  const responseUser = await User.findById(user._id).select(
    "-refreshToken -password",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: responseUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully",
      ),
    );

  //store refresh token to the db
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // getting refresh token from the cookies
  const token = req.cookies.refreshToken || req.body.refreshToken;
  if (!token) throw new ApiError(401, "Unauthorized request");

  try {
    // decode the token using jwt lib
    const decodedToken = await jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET,
    );

    // query the db to get the user and remove sensitive info from there
    const user = await User.findById(decodedToken?._id).select("-password");
    if (!user) throw new ApiError(401, "Invalid Refresh Token");

    // checking if refresh tokens are equal
    if (token !== user?.refreshToken)
      throw new ApiError(401, "Refresh token is expired or invalid");

    // generating new refresh tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  // get old and new password from the request
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  // check if old and new password are same
  if (oldPassword === newPassword) {
    throw new ApiError(400, "Old password and new password cannot be same");
  }

  // find the user from the db
  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  // check if old password is correct
  const isPasswordValidated = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValidated)
    throw new ApiError(401, "Old password is incorrect");

  // update the password
  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res.status(200).json(new ApiResponse(200, {}, "Password changed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken",
  );
  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(new ApiResponse(200, user, "User found"));
});

const updateUser = asyncHandler(async (req, res) => {
  // get the fields from the request
  const { fullName, email } = req.body;
  if (!(fullName || email)) {
    throw new ApiError(400, "Provide at least one field to update");
  }
  if (email) {
    validateEmail(email);
    validateUserFields([email]);
  }
  if (fullName) {
    validateUserFields([fullName]);
  }

  // find the user from the db and update
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true },
  ).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, user, "User updated"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  // check if avatar is there in the request
  const avatar = req.file?.path;
  if (!avatar) {
    throw new ApiError(400, "Avatar image is required");
  }

  // get the user from the db
  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  // delete old file from cloudinary
  const response = await deleteFromCloudinary(user.avatar);
  if (!response)
    throw new ApiError(
      500,
      "Unable to delete old avatar image from cloudinary",
    );

  // upload the avatar to cloudinary
  const avatarUrl = await uploadOnCloudinary(avatar);
  if (!avatarUrl)
    throw new ApiError(500, "Unable to upload avatar to cloudinary");

  // update the avatar in the db
  user.avatar = avatarUrl.url;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, {}, "Avatar updated"));
});

const updateCoverImg = asyncHandler(async (req, res) => {
  // check if CoverImg is there in the request
  const CoverImg = req.file?.path;
  if (!CoverImg) {
    throw new ApiError(400, "Cover Image is required");
  }

  // get the user from the db
  const oldUser = await User.findById(req.user?._id);
  if (!oldUser) throw new ApiError(404, "User not found");

  // delete old file from cloudinary
  const response = await deleteFromCloudinary(oldUser.coverImage);
  if (!response)
    throw new ApiError(
      500,
      "Unable to delete old avatar image from cloudinary",
    );

  // upload the CoverImg to cloudinary
  const CoverImgUrl = await uploadOnCloudinary(CoverImg);
  if (!CoverImgUrl)
    throw new ApiError(500, "Unable to upload Cover Image to cloudinary");

  // update the CoverImg in the db
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: CoverImgUrl.url,
      },
    },
    { new: true },
  ).select("-password -refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, {}, "Cover Image updated"));
});

const getUserChannel = asyncHandler(async (req, res) => {
  const { username } = req.prams;
  if (!username) throw new ApiError(400, "Username is missing");

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      // all of subscriber
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      // all of my subscription
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists");
  }

  res
    .status(200)
    .json(new ApiResponse(200, channel[0], "channel data extracted"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateUser,
  updateAvatar,
  updateCoverImg,
  getUserChannel,
};

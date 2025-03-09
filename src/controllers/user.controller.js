import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validateUserFields,
  validateEmail,
} from "../validators/user.validator.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  if (!avatarLocalPath) throw new ApiError(400, "Avatart image is required");

  // upload files to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) throw new ApiError(400, "Avatart image is required");

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
    const refereshToken = user.generateRefreshToken();

    user.refereshToken = refereshToken;
    await user.save({ validateBeforeSave: false });

    return {
      accessToken,
      refereshToken,
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
  const { accessToken, refereshToken } = await generateTokens(user);

  //send tokens as cookies to the user
  const responseUser = await User.findById(user._id).select(
    "-password -refreshtoken",
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refereshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: responseUser,
          accessToken,
          refereshToken,
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
        refereshToken: undefined,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out "));
});

export { registerUser, loginUser, logoutUser };

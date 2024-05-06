import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asyncHendler.js";
import { uploadcloudinary } from "../utils/cloudnary.js";

const generateAccessAndRefereshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asynchandler(async (req, res) => {
  // get user detail from frontend
  // validation - not empty
  // check if user already exists: username, email, and number
  // check for images, check for avatar
  // upload cloudinary, avatar
  // create user object - create entry in db
  // remove Password and refresh token field from response
  // response return

  const { fullName, userName, email, Password } = req.body;
  console.log(req.body);

  if (
    [fullName, userName, email, Password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ userName: userName }, { email: email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }
  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const avatar = await uploadcloudinary(avatarLocalPath, "avatars");
  const coverImage = await uploadcloudinary(coverImageLocalPath, "coverImages");

  if (!avatar) {
    throw new ApiError(400, "Error uploading avatar");
  }
  if (!coverImage) {
    throw new ApiError(400, "Error uploading cover image");
  }
  const newUser = await User.create({
    fullName,
    userName,
    email,
    Password,
    avatar: avatar.url,
    coverImage: coverImage.url,
  });

  // Find the created user excluding sensitive fields
  const createdUser = await User.findById(newUser._id).select(
    "-Password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }
  // Send success response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asynchandler(async (req, res) => {
  const { email, userName, password } = req.body;
  console.log(email);
  console.log(userName);
  console.log(password);
  if (!userName && !email) {
    throw new ApiError(400, "Username or email is required");
  }
  const user = await User.findOne({
    $or: [{ userName: userName?.toString() }, { email: email?.toString() }],
  });
  console.log(user);
  if (!user.email) {
    throw new ApiError(404, "user is not exesist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalide password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-Password -refreshToken"
  );

  const opctions = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("accessToken", accessToken, opctions)
    .cookie("refreshToken", refreshToken, opctions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user login successfully"
      )
    );
});

const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logout successfully"));
});

export { registerUser, loginUser, logoutUser };
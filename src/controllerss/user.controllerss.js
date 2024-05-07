import { application, response } from "express";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asynchandler } from "../utils/asyncHendler.js";
import { uploadcloudinary } from "../utils/cloudnary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

const refreshAccessToken = asynchandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unothorized request");
  }
  try {
    const decodedToken = jwt.varify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await user.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const opctions = { httpOnly: true, secure: true };

    const { accessToken, nweRefreshToken } =
      await generateAccessAndRefereshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, opctions)
      .cookie("refreshToken", nweRefreshToken, opctions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: new nweRefreshToken() },
          "access Token refresh sucessfull"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalide refresh tokrn");
  }
});

const changeCurrentPassword = asynchandler(async (req, res) => {
  const { oldPasswoed, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPasswoed);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalide password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password change successfully"));
});

const getCurrentUser = asynchandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user feched successfully"));
});

const updateAccountDetails = asynchandler(async (req, res) => {
  const { fullName, email, userName } = req.body;

  if (!fullName || !email || !userName) {
    throw new ApiError(400, "all fildes are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
        userName,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "account details updated successfully"));
});

const updateUserAvatar = asynchandler(async (req, res) => {
  const avatarLocalPath = req.files?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is missing");
  }
  const avatar = await uploadcloudinary(avatarLocalPath, "avatars");
  if (!avatar.url) {
    throw new ApiError(400, "error while uplodeing avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const updateUserCoverImage = asynchandler(async (req, res) => {
  const coverImageLocalPath = req.files?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file is missing");
  }
  const coverImage = await uploadcloudinary(coverImageLocalPath, "coverImage");
  if (!coverImage.url) {
    throw new ApiError(400, "error while uplodeing coverImage");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});

const getUserChannelProfile = asynchandler(async (req, res) => {
  const { username } = req.params;
  if (!username) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      // user match
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        // firs piplines
        from: "subsciption",
        localField: "_id",
        foreignField: "chenal",
        as: "subribers",
      },
    },
    {
      $lookup: {
        // second piplines
        from: "subsciption",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        // merge to pipe lines
        subscriberCount: {
          $size: "$subribers",
        },
        chanalSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subribers.subriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        chanalSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "cheanal dose not exesist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user chenal fached succesfully"));
});

const getWhatchHistory = asynchandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "Video",
        localField: "watchHistory",
        foreignField: "_id",
        as: "wathcHistory",
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
                    userName: 1,
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
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fached successFully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWhatchHistory,
};

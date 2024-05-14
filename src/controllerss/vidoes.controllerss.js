import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/vidoes.model.js";
import { asynchandler } from "../utils/asyncHendler.js";
import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { User } from "../models/User.model.js";

const getAllVidoes = asynchandler((req, res) => {
  const { page = 1, limit = 15, query, sortBy, sortType, userId } = req.query;
  console.log(req.query);

  const matchCondition = {
    $ro: [
      {
        title: { $regex: query, $options: "i" },
        description: { $regex: query, $options: "i" },
      },
    ],
  };
  if (userId) {
    matchCondition.owner = new mongoose.Types.ObjectId(userId);
  }
  try {
    const videoAggregate = Video.aggregate([
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "User",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 1,
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
      {
        $sort: {
          [sort || "createdAt"]: sortType || 1,
        },
      },
    ]);
  } catch (error) {
    console.log("error inaggrection vidoes:", error);
    throw new ApiError(
      500,
      error.message || "Internal server error in video aggregation"
    );
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customeLable: {
      totalDocs: "totalVideos",
      docs: "videos",
    },
    skip: (page - 1) * limit,
    limit: parseInt(limit),
  };

  Video.aggregatePaginate(videoAggregate, options)
    .then((result) => {
      if (result?.voides?.length === 0 && userId) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "vidoes is not found"));
      }
      return res
        .status(200)
        .json(new ApiResponse(200, result, "video fetched successfully"));
    })
    .catch((error) => {
      console.log("error:", error);
      throw new ApiError(
        500,
        error?.message || "Internal server error in video aggregate Paginate"
      );
    });
});
const publishVidoes = asynchandler((req, res) => {
  const { title, description } = req.body;
  console.log(req.body);
});

const getVideoById = asynchandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "video not found");
  }
  const findVideo = await Video.findById(videoId);
  if (!findVideo) {
    throw new ApiError(404, "video not found");
  }

  const user = await Video.findById(res.user?._id, { watchHistory: 1 });
  if (!user?.watchHistory.includes(videoId)) {
    await Video.findByIdAndUpdate(
      videoId,
      {
        $inc: { views: 1 },
      },
      {
        new: true,
      }
    );
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: {
        watchHistory: videoId,
      },
    },
    {
      new: true,
    }
  );
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
              _id: 1,
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
    {
      $addFields: {
        videoFile: "$videoFile.url",
      },
    },
    {
      $addFields: {
        thumbnail: "$thumbnail.url",
      },
    
    
  ]);
});

export { getAllVidoes };

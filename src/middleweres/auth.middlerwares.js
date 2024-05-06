import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/asyncHendler.js";
import jwt from "jsonwebtoken";

export const verifJWT = asynchandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "unauthorized request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      // todo : doscuss about frountend
      throw new ApiError(401, "invalid access token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalide access token");
  }
});

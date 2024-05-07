import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWhatchHistory,
} from "../controllerss/user.controllerss.js";
import { upload } from "../middleweres/multer.js";
import { verifJWT } from "../middleweres/auth.middlerwares.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
// sequired router
router.route("/logout").post(verifJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifJWT, changeCurrentPassword);
router.route("/current-user").get(verifJWT, getCurrentUser);
router.route("/update-account").patch(updateAccountDetails);
router
  .route("/avatar")
  .patch(verifJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/cover-image")
  .patch(verifJWT, upload.single("/coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifJWT, getUserChannelProfile);
router.route("WatchHistory").get(verifJWT, getWhatchHistory);

export default router;

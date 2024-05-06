import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
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

export default router;

import express from "express";
import cros from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cros({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes import
import userRouter from "./routes/user.js";
import router from "./routes/user.js";

// Routes declaration
app.use("/users", router);
export { app };

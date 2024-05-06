import { connectDB } from "./db/database.js";
import dotenv from "dotenv";
dotenv.config();
import { app } from "./app.js";
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8080, () => {
      console.log(`server is runiig ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("mongo db connect lose", err);
  });

import mongoose from "mongoose";
import * as dotenv from "dotenv";
// import { DB_NAME } from "../constants";
dotenv.config();
// const DB_NAME = youtub;
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}`
    );
    console.log(`\n MongoDB connected: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("MongoDB connect error: ", error);
    process.exit(1);
  }
};
export { connectDB };

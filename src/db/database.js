

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${"mongodb+srv://backend123:backend123@backend.0szpc4s.mongodb.net"}/${DB_NAME}`);
        
        console.log(`\n MongoDB connected: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connect error: ", error);
        process.exit(1);
    }
}
export {connectDB};

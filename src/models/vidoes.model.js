import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  Username: {
    type: String,
    require: true,
    lowecase: true,
    unique,
  },
});

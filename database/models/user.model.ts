import { Document, Schema, model, models } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const User = models?.User || model<UserDocument>("User", UserSchema);

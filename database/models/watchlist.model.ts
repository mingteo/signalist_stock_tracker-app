import { Document, Schema, model, models } from "mongoose";

// Interface for the Watchlist document
export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

// Schema definition
const WatchlistSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for userId + symbol
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

// Export the model with hot-reload protection
export const Watchlist =
  models?.Watchlist || model<WatchlistItem>("Watchlist", WatchlistSchema);

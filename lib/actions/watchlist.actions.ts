"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";
import { User } from "@/database/models/user.model";

export async function getWatchlistSymbolsByEmail(
  email: string,
): Promise<string[]> {
  try {
    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`No user found for email: ${email}`);
      return [];
    }

    // Get watchlist items for user
    const watchlistItems = await Watchlist.find(
      { userId: user._id },
      { symbol: 1, _id: 0 },
    );

    // Extract and return just the symbols
    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return [];
  }
}

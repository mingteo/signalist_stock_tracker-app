import { connectToDatabase } from "@/database/mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();

    // If connection is successful, send a success response
    return NextResponse.json(
      {
        status: "success",
        message: "✅ Database connected successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    // If connection fails, send an error response
    console.error("Database connection failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "❌ Database connection failed.",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

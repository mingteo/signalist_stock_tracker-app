import { User } from "@/database/models/user.model";
import { connectToDatabase } from "@/database/mongoose";
import { sendWelcomeEmail, sendNewsEmail } from "../nodemailer";
import { inngest } from "./client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { getWatchlistSymbolsByEmail } from "../actions/watchlist.actions";
import { getNews } from "../actions/finnhub.actions";

// Replace the existing Gemini interfaces with these typed versions
interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

interface GeminiContent {
  parts?: GeminiPart[];
  role?: "user" | "assistant" | "system";
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: "STOP" | "MAX_TOKENS" | "SAFETY" | "RECITATION" | "OTHER";
  index?: number;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

// Helper function for getting users
async function getAllUsersForNewsEmail(): Promise<User[]> {
  await connectToDatabase();
  return User.find({});
}

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile,
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thank for joining Signalist. You now have the tools to track markets and make smarter moves.";

      const {
        data: { email, name },
      } = event;
      return await sendWelcomeEmail({
        email,
        name,
        intro: introText,
      });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  },
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "daily-news-summary" },
  [
    { event: "app/send.daily.news" },
    { cron: "* * * * *" }, // Run once daily at 9:00 AM UTC
  ],
  async ({ step }) => {
    // Get all users for news delivery
    const users = await step.run("get-all-users", async () => {
      return getAllUsersForNewsEmail();
    });

    if (!users || users.length === 0) {
      return { success: false, message: "No users found for news email" };
    }

    const results = [];

    // Process each user
    for (const user of users) {
      try {
        await step.run(`Process user ${user.email}`, async () => {
          const symbols = await getWatchlistSymbolsByEmail(user.email);
          const news = await getNews(symbols);

          const aiResponse = await step.ai.infer("summarize-news", {
            model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
            body: {
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text:
                        "Summarize the following news articles briefly:\n" +
                        news.map((n) => `- ${n.headline}`).join("\n"),
                    },
                  ],
                },
              ],
            },
          });

          // Type-safe extraction of summary text
          const candidate = aiResponse.candidates?.[0] as GeminiCandidate;
          const summaryText =
            candidate?.content?.parts?.[0]?.text ||
            "Unable to generate summary for today's news.";

          await sendNewsEmail({
            to: user.email,
            news: news,
            summary: summaryText,
          });

          results.push({ success: true, email: user.email });
        });
      } catch (error) {
        console.error(`Failed to process user ${user.email}:`, error);
        results.push({
          success: false,
          email: user.email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      processedUsers: results,
    };
  },
);

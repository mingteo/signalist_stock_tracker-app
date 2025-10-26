"use server";

import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import { cache } from "react";

// Minimal type definitions as requested
interface FinnhubSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
  // Internal property to carry over exchange from profile calls
  __exchange?: string;
}

interface FinnhubSearchResponse {
  count: number;
  result: FinnhubSearchResult[];
}

interface StockWithWatchlistStatus {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  isInWatchlist: boolean;
}

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

async function fetchJSON(url: string, revalidateSeconds?: number) {
  if (!FINNHUB_API_KEY) {
    throw new Error(
      "NEXT_PUBLIC_FINNHUB_API_KEY is not defined in environment variables.",
    );
  }
  const options: RequestInit = {
    headers: {
      "X-Finnhub-Token": FINNHUB_API_KEY,
    },
  };

  if (revalidateSeconds !== undefined) {
    options.next = { revalidate: revalidateSeconds };
    options.cache = "force-cache";
  } else {
    options.cache = "no-store";
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HTTP error! status: ${response.status}, message: ${errorText}`,
    );
  }
  return response.json();
}

export const searchStocks = cache(
  async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
      let results: FinnhubSearchResult[] = [];
      const trimmedQuery = query?.trim();

      if (!trimmedQuery) {
        // Fetch top 10 popular symbols' profiles
        const topSymbols = POPULAR_STOCK_SYMBOLS.slice(0, 10);
        const profilePromises = topSymbols.map(async (sym) => {
          const profile = await fetchJSON(
            `${FINNHUB_BASE_URL}/stock/profile2?symbol=${sym}&token=${FINNHUB_API_KEY}`,
            3600,
          );
          return {
            symbol: sym,
            description: profile.name || sym,
            displaySymbol: sym,
            type: "Common Stock",
            __exchange: profile.exchange || "US",
          };
        });
        results = await Promise.all(profilePromises);
      } else {
        const data: FinnhubSearchResponse = await fetchJSON(
          `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(
            trimmedQuery,
          )}&token=${FINNHUB_API_KEY}`,
          1800,
        );
        results = data.result || [];
      }

      return results
        .map((r) => ({
          symbol: r.symbol.toUpperCase(),
          name: r.description,
          exchange: r.displaySymbol || r.__exchange || "US",
          type: r.type || "Stock",
          isInWatchlist: false, // Set to false for now
        }))
        .slice(0, 15);
    } catch (error) {
      console.error("Error in stock search:", error);
      return [];
    }
  },
);

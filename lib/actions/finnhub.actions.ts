"use server";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

async function fetchJSON(url: string, revalidateSeconds?: number) {
  const options: RequestInit = {
    headers: {
      "X-Finnhub-Token": FINNHUB_API_KEY!,
    },
    cache: revalidateSeconds ? "force-cache" : "no-store",
    ...(revalidateSeconds && { next: { revalidate: revalidateSeconds } }),
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

interface NewsArticle {
  id: number;
  datetime: number;
  headline: string;
  summary: string;
  url: string;
  source: string;
  image?: string;
}

export async function getNews(symbols?: string[]): Promise<NewsArticle[]> {
  try {
    // Calculate date range (last 5 days)
    const toDate = Math.floor(Date.now() / 1000);
    const fromDate = toDate - 5 * 24 * 60 * 60;

    if (symbols && symbols.length > 0) {
      const cleanSymbols = symbols
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const articles: NewsArticle[] = [];
      const maxRounds = Math.min(6, cleanSymbols.length);

      // Round-robin through symbols
      for (let round = 0; round < maxRounds; round++) {
        const symbol = cleanSymbols[round % cleanSymbols.length];
        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}`;

        const news = await fetchJSON(url);
        const validArticle = news.find(
          (article: NewsArticle) =>
            article.headline &&
            article.summary &&
            article.url &&
            !articles.some(
              (a) => a.url === article.url || a.headline === article.headline,
            ),
        );

        if (validArticle) {
          articles.push(validArticle);
        }
      }

      return articles.sort((a, b) => b.datetime - a.datetime).slice(0, 6);
    } else {
      // Fetch general market news
      const url = `${FINNHUB_BASE_URL}/news?category=general`;
      const news = await fetchJSON(url);

      return news
        .filter(
          (article: NewsArticle) =>
            article.headline && article.summary && article.url,
        )
        .slice(0, 6)
        .sort((a: NewsArticle, b: NewsArticle) => b.datetime - a.datetime);
    }
  } catch (error) {
    console.error("Failed to fetch news:", error);
    throw new Error("Failed to fetch news");
  }
}

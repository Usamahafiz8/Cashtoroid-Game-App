// TikTok and Instagram block most scraping; admin manual-views update is the fallback.

async function fetchPageHTML(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export async function fetchTikTokViews(videoUrl: string): Promise<number> {
  const html = await fetchPageHTML(videoUrl);
  if (!html) {
    console.error(`[TikTok] Failed to fetch page: ${videoUrl}`);
    return -1;
  }

  const patterns = [/"playCount":(\d+)/, /"play_count":(\d+)/];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return parseInt(m[1], 10);
  }

  console.error(`[TikTok] Could not parse view count from: ${videoUrl}`);
  return -1;
}

export async function fetchInstagramViews(videoUrl: string): Promise<number> {
  const html = await fetchPageHTML(videoUrl);
  if (!html) {
    console.error(`[Instagram] Failed to fetch page: ${videoUrl}`);
    return -1;
  }

  const m = html.match(/og:video:view_count[^>]+content="(\d+)"/);
  if (m) return parseInt(m[1], 10);

  const m2 = html.match(/"video_view_count":(\d+)/);
  if (m2) return parseInt(m2[1], 10);

  console.error(`[Instagram] Could not parse view count from: ${videoUrl}`);
  return -1;
}

export async function fetchViews(video: {
  url: string;
  platform: string;
}): Promise<number> {
  switch (video.platform) {
    case "youtube": {
      const { fetchYouTubeViews } = await import("@/lib/youtube");
      return fetchYouTubeViews(video.url);
    }
    case "tiktok":
      return fetchTikTokViews(video.url);
    case "instagram":
      return fetchInstagramViews(video.url);
    default:
      return -1;
  }
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?#]+)/,
    /\/embed\/([^?#]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export async function fetchYouTubeViews(videoUrl: string): Promise<number> {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) {
    console.error(`[YouTube] Could not extract video ID from: ${videoUrl}`);
    return -1;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("[YouTube] YOUTUBE_API_KEY is not set");
    return -1;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`,
      { next: { revalidate: 0 } }
    );

    if (!res.ok) {
      console.error(`[YouTube] API error ${res.status} for video ${videoId}`);
      return -1;
    }

    const data = await res.json();
    const viewCount = data?.items?.[0]?.statistics?.viewCount;
    if (viewCount === undefined) {
      console.error(`[YouTube] No viewCount in response for video ${videoId}`);
      return -1;
    }

    return parseInt(viewCount, 10);
  } catch (err) {
    console.error(`[YouTube] Fetch failed for ${videoUrl}:`, err);
    return -1;
  }
}

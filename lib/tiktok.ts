import type { TikTokVideoItem } from "@/types";

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USER_URL = "https://open.tiktokapis.com/v2/user/info/";
const TIKTOK_VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/";

function getClientKey() {
  const k = process.env.TIKTOK_CLIENT_KEY;
  if (!k) throw new Error("TIKTOK_CLIENT_KEY is not set");
  return k;
}

function getClientSecret() {
  const s = process.env.TIKTOK_CLIENT_SECRET;
  if (!s) throw new Error("TIKTOK_CLIENT_SECRET is not set");
  return s;
}

function getRedirectUri() {
  const r = process.env.TIKTOK_REDIRECT_URI;
  if (!r) throw new Error("TIKTOK_REDIRECT_URI is not set");
  return r;
}

export function buildOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: getClientKey(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "user.info.basic,video.list",
    state,
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  openId: string;
}> {
  const body = new URLSearchParams({
    client_key: getClientKey(),
    client_secret: getClientSecret(),
    code,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(),
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.error) throw new Error(`TikTok token exchange failed: ${data.error_description}`);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    openId: data.open_id,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    client_key: getClientKey(),
    client_secret: getClientSecret(),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.error) throw new Error(`TikTok token refresh failed: ${data.error_description}`);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function fetchTikTokUserInfo(accessToken: string): Promise<{
  openId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}> {
  const url = `${TIKTOK_USER_URL}?fields=open_id,display_name,avatar_url,username`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await res.json();
  if (data.error?.code !== "ok") {
    throw new Error(`TikTok user info failed: ${data.error?.message}`);
  }

  const u = data.data?.user;
  return {
    openId: u.open_id,
    username: u.username ?? u.open_id,
    displayName: u.display_name ?? u.username,
    avatarUrl: u.avatar_url ?? "",
  };
}

export async function fetchTikTokVideos(
  accessToken: string,
  cursor = 0,
  maxCount = 20
): Promise<{ videos: TikTokVideoItem[]; cursor: number; hasMore: boolean }> {
  const res = await fetch(
    `${TIKTOK_VIDEO_LIST_URL}?fields=id,title,cover_image_url,share_url,duration,view_count,like_count,create_time`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: maxCount, cursor }),
    }
  );

  const data = await res.json();
  if (data.error?.code !== "ok") {
    throw new Error(`TikTok video list failed: ${data.error?.message}`);
  }

  const videos: TikTokVideoItem[] = (data.data?.videos ?? []).map(
    (v: Record<string, unknown>) => ({
      id: v.id as string,
      title: (v.title as string) ?? null,
      coverImageUrl: (v.cover_image_url as string) ?? null,
      shareUrl: v.share_url as string,
      viewCount: (v.view_count as number) ?? 0,
      likeCount: (v.like_count as number) ?? 0,
      duration: (v.duration as number) ?? 0,
      createTime: (v.create_time as number) ?? 0,
    })
  );

  return {
    videos,
    cursor: data.data?.cursor ?? 0,
    hasMore: data.data?.has_more ?? false,
  };
}

export function encodeState(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64url");
}

export function decodeState(state: string): { userId: string; ts: number } | null {
  try {
    return JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return null;
  }
}

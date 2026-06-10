export type Platform = "youtube" | "tiktok" | "instagram";
export type VideoStatus = "pending" | "approved" | "rejected";
export type UserRole = "user" | "admin";
export type TransactionStatus = "pending" | "approved" | "rejected";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalViews: number;
  videoCount: number;
  isPaid: boolean;
}

export interface VideoWithUser {
  id: string;
  url: string;
  platform: Platform;
  title: string | null;
  currentViews: number;
  baseViews: number;
  lastCheckedAt: Date | null;
  status: VideoStatus;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface PayoutEntry extends LeaderboardEntry {
  email: string;
  payoutInfo: string | null;
  isPaid: boolean;
  paidAt: Date | null;
}

export interface PrizeTier {
  rank: number;
  amount: number;
}

export interface TikTokVideoItem {
  id: string;
  title: string | null;
  coverImageUrl: string | null;
  shareUrl: string;
  viewCount: number;
  likeCount: number;
  duration: number;
  createTime: number;
}

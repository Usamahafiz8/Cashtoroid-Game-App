"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface TikTokAccount {
  id: string;
  tiktokUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
}

interface TikTokVideo {
  id: string;
  title: string | null;
  coverImageUrl: string | null;
  shareUrl: string;
  viewCount: number;
  likeCount: number;
  duration: number;
  accountId: string;
  accountUsername: string;
}

function TikTokPageInner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const errorParam = searchParams.get("error");

  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const [selectedAccount, setSelectedAccount] = useState<TikTokAccount | null>(null);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoCursor, setVideoCursor] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitMsg, setSubmitMsg] = useState<{ videoId: string; text: string; ok: boolean } | null>(null);

  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  function showToast(text: string, ok: boolean) {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4000);
  }

  function loadAccounts() {
    setLoadingAccounts(true);
    fetch("/api/tiktok/accounts")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.data ?? []);
        setLoadingAccounts(false);
      });
  }

  useEffect(() => {
    loadAccounts();
    if (connected) {
      const username = searchParams.get("username");
      showToast(`TikTok account @${username} connected successfully!`, true);
      window.history.replaceState({}, "", "/dashboard/tiktok");
    }
    if (errorParam) {
      showToast(`Connection failed: ${errorParam}`, false);
      window.history.replaceState({}, "", "/dashboard/tiktok");
    }
  }, []);

  async function connectTikTok() {
    setConnecting(true);
    const res = await fetch("/api/tiktok/auth/url");
    const d = await res.json();
    if (d.success && d.data?.url) {
      window.location.href = d.data.url;
    } else {
      showToast(d.error ?? "Failed to generate TikTok auth URL", false);
      setConnecting(false);
    }
  }

  async function disconnect(accountId: string) {
    if (!confirm("Disconnect this TikTok account?")) return;
    setDisconnecting(accountId);
    const res = await fetch(`/api/tiktok/accounts/${accountId}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) {
      showToast("Account disconnected.", true);
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(null);
        setVideos([]);
      }
      loadAccounts();
    } else {
      showToast(d.error ?? "Failed to disconnect.", false);
    }
    setDisconnecting(null);
  }

  async function loadVideos(account: TikTokAccount, cursor = 0) {
    if (cursor === 0) {
      setVideos([]);
      setLoadingVideos(true);
    } else {
      setLoadingMore(true);
    }
    setSelectedAccount(account);

    const res = await fetch(`/api/tiktok/accounts/${account.id}/videos?cursor=${cursor}`);
    const d = await res.json();

    if (d.success) {
      if (cursor === 0) {
        setVideos(d.data.videos ?? []);
      } else {
        setVideos((prev) => [...prev, ...(d.data.videos ?? [])]);
      }
      setVideoCursor(d.data.cursor ?? 0);
      setHasMore(d.data.hasMore ?? false);
    } else {
      showToast(d.error ?? "Failed to load videos.", false);
    }
    setLoadingVideos(false);
    setLoadingMore(false);
  }

  async function submitVideo(videoId: string, accountId: string) {
    setSubmitting(videoId);
    setSubmitMsg(null);
    const res = await fetch(`/api/tiktok/videos/${videoId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    const d = await res.json();
    setSubmitting(null);
    setSubmitMsg({
      videoId,
      text: d.success ? "Submitted for review!" : (d.error ?? d.message ?? "Failed to submit."),
      ok: d.success,
    });
    setTimeout(() => setSubmitMsg(null), 4000);
  }

  function formatViews(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  return (
    <div style={{ padding: 32 }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 8,
            backgroundColor: toast.ok ? "#f0fff4" : "#fff5f5",
            border: `1px solid ${toast.ok ? "#9ae6b4" : "#fed7d7"}`,
            color: toast.ok ? "#276749" : "#e94560",
            fontWeight: 600,
            fontSize: "0.875rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {toast.text}
        </div>
      )}

      <h1 style={h1}>TikTok</h1>
      <p style={sub}>Connect your TikTok account to submit videos for the challenge</p>

      <div style={{ display: "grid", gridTemplateColumns: selectedAccount ? "320px 1fr" : "1fr", gap: 20, alignItems: "start" }}>
        {/* Accounts panel */}
        <div>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={cardTitle}>Connected Accounts</h3>
              <button
                onClick={connectTikTok}
                disabled={connecting}
                style={{
                  padding: "7px 14px",
                  backgroundColor: connecting ? "#a0aec0" : "#1a1a2e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: connecting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: "1rem" }}>♪</span>
                {connecting ? "Redirecting…" : "Connect Account"}
              </button>
            </div>

            {loadingAccounts ? (
              <div style={{ color: "#a0aec0", fontSize: "0.875rem" }}>Loading…</div>
            ) : accounts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>♪</div>
                <div style={{ color: "#4a5568", fontSize: "0.875rem", marginBottom: 6 }}>
                  No TikTok accounts connected yet.
                </div>
                <div style={{ color: "#a0aec0", fontSize: "0.8rem" }}>
                  Click "Connect Account" to link your TikTok.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {accounts.map((acc) => {
                  const isSelected = selectedAccount?.id === acc.id;
                  const isExpired = acc.tokenExpiresAt && new Date(acc.tokenExpiresAt) < new Date();
                  return (
                    <div
                      key={acc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `2px solid ${isSelected ? "#e94560" : "#e2e8f0"}`,
                        backgroundColor: isSelected ? "#e9456008" : "#fafafa",
                        cursor: "pointer",
                      }}
                      onClick={() => loadVideos(acc)}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          backgroundColor: "#1a1a2e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "1rem",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {acc.avatarUrl ? (
                          <img src={acc.avatarUrl} alt={acc.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          acc.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          @{acc.username}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#718096", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {acc.displayName}
                        </div>
                        {isExpired && (
                          <div style={{ fontSize: "0.7rem", color: "#e94560", marginTop: 2 }}>
                            Token expired — reconnect
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); disconnect(acc.id); }}
                        disabled={disconnecting === acc.id}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "transparent",
                          border: "1px solid #e94560",
                          borderRadius: 4,
                          color: "#e94560",
                          fontSize: "0.7rem",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        {disconnecting === acc.id ? "…" : "Disconnect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* How it works */}
          <div style={{ ...card, marginTop: 16 }}>
            <h3 style={cardTitle}>How It Works</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["1", "Connect your TikTok account via OAuth."],
                ["2", "Browse your TikTok videos here."],
                ["3", "Click Submit on any video to enter it in the challenge."],
                ["4", "An admin reviews and approves it."],
                ["5", "Views count toward your leaderboard rank."],
              ].map(([n, t]) => (
                <div key={n} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#e94560", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
                    {n}
                  </div>
                  <div style={{ color: "#4a5568", fontSize: "0.8rem", lineHeight: 1.5 }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Videos panel */}
        {selectedAccount && (
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div>
                <h3 style={{ ...cardTitle, margin: 0 }}>@{selectedAccount.username}'s Videos</h3>
                <div style={{ color: "#a0aec0", fontSize: "0.75rem", marginTop: 2 }}>
                  Click Submit to enter a video in the challenge
                </div>
              </div>
            </div>

            {loadingVideos ? (
              <div style={{ color: "#a0aec0", padding: "32px 0", textAlign: "center" }}>Loading videos…</div>
            ) : videos.length === 0 ? (
              <div style={{ color: "#a0aec0", padding: "32px 0", textAlign: "center", fontSize: "0.875rem" }}>
                No videos found for this account.
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {videos.map((v) => {
                    const isSubmitting = submitting === v.id;
                    const msg = submitMsg?.videoId === v.id ? submitMsg : null;
                    return (
                      <div
                        key={v.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          overflow: "hidden",
                          backgroundColor: "#fff",
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            height: 140,
                            backgroundColor: "#1a1a2e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {v.coverImageUrl ? (
                            <img
                              src={v.coverImageUrl}
                              alt={v.title ?? "TikTok video"}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: "2.5rem", opacity: 0.3 }}>♪</span>
                          )}
                          <a
                            href={v.shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              backgroundColor: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              fontSize: "0.65rem",
                              padding: "3px 7px",
                              borderRadius: 4,
                              textDecoration: "none",
                            }}
                          >
                            View ↗
                          </a>
                        </div>

                        {/* Info */}
                        <div style={{ padding: "10px 12px" }}>
                          {v.title && (
                            <div style={{ fontSize: "0.8rem", color: "#1a1a2e", fontWeight: 600, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {v.title}
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: "0.72rem", color: "#718096" }}>
                              👁 {formatViews(v.viewCount)}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "#718096" }}>
                              ♥ {formatViews(v.likeCount)}
                            </span>
                          </div>

                          {msg && (
                            <div style={{ fontSize: "0.72rem", color: msg.ok ? "#276749" : "#e94560", marginBottom: 6, fontWeight: 600 }}>
                              {msg.text}
                            </div>
                          )}

                          <button
                            onClick={() => submitVideo(v.id, v.accountId)}
                            disabled={isSubmitting || (msg?.ok ?? false)}
                            style={{
                              width: "100%",
                              padding: "7px 0",
                              backgroundColor:
                                msg?.ok ? "#48bb78" :
                                isSubmitting ? "#a0aec0" : "#e94560",
                              color: "#fff",
                              border: "none",
                              borderRadius: 5,
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: isSubmitting || msg?.ok ? "not-allowed" : "pointer",
                            }}
                          >
                            {msg?.ok ? "Submitted ✓" : isSubmitting ? "Submitting…" : "Submit to Challenge"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
                  <div style={{ textAlign: "center", marginTop: 20 }}>
                    <button
                      onClick={() => loadVideos(selectedAccount, videoCursor)}
                      disabled={loadingMore}
                      style={{
                        padding: "9px 24px",
                        backgroundColor: loadingMore ? "#a0aec0" : "#0f3460",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: loadingMore ? "not-allowed" : "pointer",
                      }}
                    >
                      {loadingMore ? "Loading…" : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TikTokPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: "#718096" }}>Loading…</div>}>
      <TikTokPageInner />
    </Suspense>
  );
}

const h1: React.CSSProperties = { margin: "0 0 8px", color: "#1a1a2e", fontSize: "1.5rem", fontWeight: 700 };
const sub: React.CSSProperties = { margin: "0 0 24px", color: "#718096", fontSize: "0.875rem" };
const card: React.CSSProperties = { backgroundColor: "#fff", borderRadius: 8, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const cardTitle: React.CSSProperties = { margin: "0 0 16px", color: "#1a1a2e", fontSize: "1rem", fontWeight: 600 };

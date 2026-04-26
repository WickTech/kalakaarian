import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";

interface FeedPost {
  _id: string;
  contentUrl: string;
  thumbnailUrl?: string;
  platform: string;
  caption?: string;
  submittedAt: string;
  creatorName: string;
  avatar: string;
  handle: string;
  tier: string;
  genre?: string;
  likes: number;
  type: "video" | "image";
}

interface SidebarCreator {
  _id: string;
  name: string;
  avatar: string;
  tier: string;
  genre?: string;
}

const TIER_CLASS: Record<string, string> = {
  nano: "tier-nano", micro: "tier-micro", mid: "tier-macro",
  macro: "tier-macro", mega: "tier-celebrity",
};

export default function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [sidebarCreators, setSidebarCreators] = useState<SidebarCreator[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    document.title = "Feed — Kalakaarian";
    loadFeed(1);
    loadCreators();
  }, []);

  const loadFeed = async (p: number) => {
    setLoading(true);
    try {
      const data = await api.getFeed({ page: p, limit: 12 });
      const incoming: FeedPost[] = data?.posts || [];
      if (p === 1) setPosts(incoming);
      else setPosts((prev) => [...prev, ...incoming]);
      setHasMore(p < (data?.pages || 1));
      setPage(p);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCreators = async () => {
    try {
      const data = await api.searchInfluencers({});
      setSidebarCreators(
        (Array.isArray(data) ? data : []).slice(0, 5).map((c: Record<string, unknown>) => ({
          _id: (c._id || c.id) as string,
          name: c.name as string,
          avatar: (c.profileImage as string) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`,
          tier: (c.tier as string) || "micro",
          genre: (c.niches as string[])?.[0],
        }))
      );
    } catch { /* ignore */ }
  };

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-chalk">Creator Feed</h1>
          <p className="text-chalk-dim text-sm mt-1">Latest content from verified creators</p>
        </div>

        <div className="flex gap-6">
          {/* Feed */}
          <div className="flex-1 space-y-4">
            {loading && posts.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="feed-post p-8 text-center">
                <p className="text-chalk-dim text-sm mb-4">No content yet — creators are still publishing!</p>
                <Link to="/influencer-register" className="purple-pill px-5 py-2 text-sm">Join as Creator →</Link>
              </div>
            ) : posts.map((post) => (
              <div key={post._id} className="feed-post">
                {/* Creator header */}
                <div className="flex items-center gap-3 p-4">
                  <img src={post.avatar} alt={post.creatorName} className="w-10 h-10 rounded-full object-cover bg-charcoal" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-chalk truncate">{post.creatorName}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${TIER_CLASS[post.tier] || ""}`}>
                        {post.tier.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-chalk-dim">{post.handle ? `@${post.handle.replace("@", "")}` : post.genre || ""}</p>
                  </div>
                  <span className="text-xs text-chalk-faint">{new Date(post.submittedAt).toLocaleDateString()}</span>
                </div>

                {/* Media */}
                <div className="video-placeholder aspect-video relative">
                  {post.type === "video" ? (
                    <video src={post.contentUrl} controls className="w-full h-full object-cover creator-img" />
                  ) : (
                    <img src={post.thumbnailUrl || post.contentUrl} alt={post.caption || "Post"} className="w-full h-full object-cover creator-img" />
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 flex items-center gap-4">
                  <button onClick={() => toggleLike(post._id)} className="flex items-center gap-1.5 transition-colors group">
                    <Heart className={`w-4 h-4 transition-colors ${liked.has(post._id) ? "fill-red-500 text-red-500" : "text-chalk-dim group-hover:text-red-400"}`} />
                    <span className="text-xs text-chalk-dim">{post.likes + (liked.has(post._id) ? 1 : 0)}</span>
                  </button>
                  {post.caption && (
                    <p className="text-xs text-chalk-dim flex-1 truncate">{post.caption}</p>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <button onClick={() => loadFeed(page + 1)} disabled={loading}
                  className="purple-pill px-6 py-2.5 text-sm disabled:opacity-50">
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-4">
            <div className="bento-card p-4">
              <h2 className="font-display font-bold text-chalk text-sm mb-3">Discover Creators</h2>
              <div className="space-y-3">
                {sidebarCreators.length === 0 ? (
                  <p className="text-xs text-chalk-dim">No creators yet.</p>
                ) : sidebarCreators.map((c) => (
                  <div key={c._id} className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover bg-charcoal" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-chalk truncate">{c.name}</p>
                      <p className="text-[10px] text-chalk-dim">{c.genre || c.tier}</p>
                    </div>
                    <Link to="/marketplace" className="text-[10px] text-gold hover:underline">View</Link>
                  </div>
                ))}
              </div>
              <Link to="/marketplace" className="block text-xs text-gold hover:underline mt-4 text-center">
                Browse All Creators →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

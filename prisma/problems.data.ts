export const PROBLEMS = [
  {
    slug: "url-shortener",
    title: "URL Shortener",
    difficulty: "EASY" as const,
    category: "Web",
    statement:
      "Design a service like bit.ly that takes a long URL and returns a short, unique alias. Visiting the short URL redirects to the original.",
    functionalRequirements: [
      "Generate a short unique code for a submitted long URL",
      "Redirect a short URL to its original long URL",
      "Support custom aliases (optional)",
    ],
    nonFunctionalRequirements: [
      "Redirect latency under 100ms",
      "Highly available — redirects should not go down",
      "Short codes must not collide",
    ],
    constraints: ["100M new URLs per month", "100:1 read:write ratio"],
    referenceScale: { expectedQps: 400, dau: 5_000_000 },
  },
  {
    slug: "rate-limiter",
    title: "Distributed Rate Limiter",
    difficulty: "MEDIUM" as const,
    category: "Infrastructure",
    statement:
      "Design a rate limiter that can be used as a shared service by multiple API gateways to enforce per-user request limits (e.g. 100 requests/minute).",
    functionalRequirements: [
      "Enforce a configurable limit per user per time window",
      "Return whether a request is allowed or should be rejected",
      "Support limits shared across multiple gateway instances",
    ],
    nonFunctionalRequirements: [
      "Decision latency under 10ms",
      "Must work correctly across horizontally scaled gateway instances",
      "Should survive a single node failure without losing all limit state",
    ],
    constraints: ["50K requests/sec across all gateways", "Limits configurable per API key"],
    referenceScale: { expectedQps: 50_000 },
  },
  {
    slug: "news-feed",
    title: "Social Media News Feed",
    difficulty: "HARD" as const,
    category: "Social",
    statement:
      "Design the backend for a news feed (like Twitter/X) — users follow other users and see a reverse-chronological feed of posts from people they follow.",
    functionalRequirements: [
      "Users can post short text updates",
      "Users can follow/unfollow other users",
      "Users can fetch a feed of recent posts from people they follow",
    ],
    nonFunctionalRequirements: [
      "Feed load latency under 300ms for the 99th percentile",
      "Support users with millions of followers (celebrity problem)",
      "Eventually consistent feed is acceptable",
    ],
    constraints: ["200M daily active users", "5B posts/day read volume"],
    referenceScale: { expectedQps: 60_000, dau: 200_000_000 },
  },
  {
    slug: "ride-sharing-dispatch",
    title: "Ride-Sharing Dispatch",
    difficulty: "HARD" as const,
    category: "Real-time",
    statement:
      "Design the system that matches riders requesting a trip with nearby available drivers, similar to Uber/Lyft's dispatch core.",
    functionalRequirements: [
      "Track driver locations in near real-time",
      "Match a rider request to the nearest available driver",
      "Notify both parties once matched",
    ],
    nonFunctionalRequirements: [
      "Match decision under 2 seconds",
      "Location updates from drivers every few seconds at city scale",
      "Tolerant of driver app disconnects/reconnects",
    ],
    constraints: ["1M active drivers globally", "Location pings every 4 seconds per driver"],
    referenceScale: { expectedQps: 250_000 },
  },
  {
    slug: "chat-application",
    title: "Real-Time Chat",
    difficulty: "MEDIUM" as const,
    category: "Real-time",
    statement:
      "Design a one-to-one and group chat system like WhatsApp — messages should be delivered in near real-time and available on reconnect.",
    functionalRequirements: [
      "Send and receive messages in 1:1 and group conversations",
      "Deliver messages to online recipients in near real-time",
      "Persist message history for offline users to fetch on reconnect",
    ],
    nonFunctionalRequirements: [
      "Message delivery latency under 500ms when recipient is online",
      "No message loss even across server restarts",
      "Support groups up to a few hundred members",
    ],
    constraints: ["50M daily active users", "Peak 1M concurrent connections"],
    referenceScale: { expectedQps: 40_000 },
  },
  {
    slug: "video-streaming-platform",
    title: "Video Streaming Platform",
    difficulty: "HARD" as const,
    category: "Media",
    statement:
      "Design the core of a video platform like YouTube — users upload videos, the platform transcodes them into multiple qualities, and viewers stream on demand.",
    functionalRequirements: [
      "Accept large video uploads and transcode into multiple resolutions",
      "Serve video playback with adaptive bitrate to viewers globally",
      "Track view counts",
    ],
    nonFunctionalRequirements: [
      "Playback start latency under 2 seconds globally",
      "Transcoding pipeline must not block upload acknowledgment",
      "Durable storage — uploaded originals must never be lost",
    ],
    constraints: ["500 hours of video uploaded per minute", "Global viewer base"],
    referenceScale: { expectedQps: 100_000 },
  },
] as const;

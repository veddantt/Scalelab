// lib/problems.ts
// Extended problem data with architecture previews, requirements, and practice skills.
// This is the single source of truth for the /problems page.

import type { Problem } from "@/lib/types";

export interface ArchPreviewNode {
  id: string;
  label: string;
  systemType: "client" | "gateway" | "service" | "cache" | "db" | "queue" | "worker" | "external";
}

export interface ArchPreviewEdge {
  from: string;
  to: string;
}

export interface SystemProfile {
  scale: string;
  throughput: string;
  latency: string;
  storage: string;
  systemType: string;
  recommendedStack: string[];
  interviewGuidance: string;
}

export interface ProblemMeta {
  problem: Problem;
  requirements: string[];
  practiceSkills: string[];
  systemProfile: SystemProfile;
  archPreview: {
    nodes: ArchPreviewNode[];
    edges: ArchPreviewEdge[];
  };
}

export const problemMeta: ProblemMeta[] = [
  {
    problem: {
      id: "url-shortener",
      title: "Design a URL Shortener",
      difficulty: "Beginner",
      description:
        "Design a scalable URL shortener like bit.ly with low-latency reads, high availability, and analytics tracking.",
      tags: ["Hashing", "Key-Value Store", "CDN"],
      estimatedMinutes: 25,
      examples: ["bit.ly", "TinyURL", "t.co"],
    },
    requirements: [
      "Shorten long URLs into 6-8 character codes",
      "Redirect in < 10ms via CDN edge caching",
      "Handle 100M redirects/day at peak",
      "Track click analytics per link",
      "Support custom aliases and expiration",
    ],
    practiceSkills: ["Consistent hashing", "Redis caching", "CDN edge", "Base62 encoding", "Write-heavy vs read-heavy tradeoffs"],
    systemProfile: {
      scale: "100M+ Monthly",
      throughput: "1M Read / 10k Write",
      latency: "< 10ms (Redirect)",
      storage: "500TB (Archive)",
      systemType: "Read-heavy",
      recommendedStack: ["CDN", "Redis", "PostgreSQL", "Base62"],
      interviewGuidance: "Focus on read-heavy redirects, caching, collision handling, and analytics tradeoffs.",
    },
    archPreview: {
      nodes: [
        { id: "c", label: "Client", systemType: "client" },
        { id: "cdn", label: "CDN", systemType: "external" },
        { id: "api", label: "API Gateway", systemType: "gateway" },
        { id: "svc", label: "URL Service", systemType: "service" },
        { id: "cache", label: "Redis", systemType: "cache" },
        { id: "db", label: "PostgreSQL", systemType: "db" },
      ],
      edges: [
        { from: "c", to: "cdn" },
        { from: "cdn", to: "api" },
        { from: "api", to: "svc" },
        { from: "svc", to: "cache" },
        { from: "svc", to: "db" },
      ],
    },
  },
  {
    problem: {
      id: "real-time-chat",
      title: "Design a Real-Time Chat App",
      difficulty: "Intermediate",
      description:
        "Design a messaging platform like Slack or WhatsApp supporting presence, delivery receipts, and group chats.",
      tags: ["WebSockets", "Pub/Sub", "Message Queue"],
      estimatedMinutes: 35,
      examples: ["WhatsApp", "Slack", "Discord"],
    },
    requirements: [
      "Real-time message delivery via WebSockets",
      "Support group chats up to 10,000 members",
      "Online presence and typing indicators",
      "Message delivery receipts (sent/delivered/read)",
      "Persistent chat history with search",
    ],
    practiceSkills: ["WebSocket connection management", "Pub/Sub fanout", "Message ordering", "Horizontal scaling", "Eventual consistency"],
    systemProfile: {
      scale: "50M DAU",
      throughput: "500k Concurrent",
      latency: "< 50ms (E2E)",
      storage: "2PB (History)",
      systemType: "Real-time",
      recommendedStack: ["WebSockets", "Kafka", "Redis", "Cassandra"],
      interviewGuidance: "Focus on real-time delivery, ordering, fanout, presence, and message persistence.",
    },
    archPreview: {
      nodes: [
        { id: "c", label: "Client", systemType: "client" },
        { id: "ws", label: "WS Gateway", systemType: "gateway" },
        { id: "chat", label: "Chat Service", systemType: "service" },
        { id: "q", label: "Kafka", systemType: "queue" },
        { id: "w", label: "Fan-out Worker", systemType: "worker" },
        { id: "db", label: "Cassandra", systemType: "db" },
      ],
      edges: [
        { from: "c", to: "ws" },
        { from: "ws", to: "chat" },
        { from: "chat", to: "q" },
        { from: "q", to: "w" },
        { from: "chat", to: "db" },
      ],
    },
  },
  {
    problem: {
      id: "food-delivery",
      title: "Design a Food Delivery Platform",
      difficulty: "Intermediate",
      description:
        "Design a platform like DoorDash with restaurants, customers, drivers, live order tracking, and payments.",
      tags: ["Geolocation", "Microservices", "Event-Driven"],
      estimatedMinutes: 40,
      examples: ["DoorDash", "Uber Eats", "Zomato"],
    },
    requirements: [
      "Real-time driver location tracking at 1s intervals",
      "ETA calculation using maps + traffic data",
      "Order lifecycle: placed → accepted → picked up → delivered",
      "Payment processing with idempotency guarantees",
      "Restaurant and driver matching within 1km radius",
    ],
    practiceSkills: ["Geospatial indexing", "Event-driven architecture", "Saga pattern", "Payment idempotency", "Location streaming"],
    systemProfile: {
      scale: "10M Active",
      throughput: "5k Orders/min",
      latency: "< 200ms (Search)",
      storage: "100TB (Geo-logs)",
      systemType: "Distributed infra",
      recommendedStack: ["PostgreSQL", "Redis", "Kafka", "Maps API", "WebSockets"],
      interviewGuidance: "Focus on geo-matching, live location updates, dispatch latency, and payment consistency.",
    },
    archPreview: {
      nodes: [
        { id: "c", label: "Client", systemType: "client" },
        { id: "api", label: "API Gateway", systemType: "gateway" },
        { id: "ord", label: "Order Service", systemType: "service" },
        { id: "loc", label: "Location Service", systemType: "service" },
        { id: "q", label: "Event Bus", systemType: "queue" },
        { id: "db", label: "PostgreSQL", systemType: "db" },
      ],
      edges: [
        { from: "c", to: "api" },
        { from: "api", to: "ord" },
        { from: "api", to: "loc" },
        { from: "ord", to: "q" },
        { from: "ord", to: "db" },
      ],
    },
  },
  {
    problem: {
      id: "rate-limiter",
      title: "Design a Distributed Rate Limiter",
      difficulty: "Advanced",
      description:
        "Design a distributed rate limiter for APIs handling millions of requests per second with token bucket or sliding window algorithms.",
      tags: ["Distributed Systems", "Redis", "Algorithms"],
      estimatedMinutes: 30,
      examples: ["Stripe", "Cloudflare", "Kong API Gateway"],
    },
    requirements: [
      "Limit requests per user/IP at multiple time windows",
      "Handle 10M+ requests/second across 100 nodes",
      "Sliding window counter or token bucket algorithm",
      "Sub-millisecond decision latency at edge",
      "Graceful degradation on Redis failure",
    ],
    practiceSkills: ["Token bucket vs sliding window", "Redis atomic operations", "Distributed coordination", "Edge caching", "Failure modes"],
    systemProfile: {
      scale: "1B+ Global Requests",
      throughput: "10M+ RPS",
      latency: "< 1ms (Decision)",
      storage: "10TB (Counters)",
      systemType: "Read-heavy",
      recommendedStack: ["Redis", "Lua Scripts", "Token Bucket", "gRPC"],
      interviewGuidance: "Focus on ultra-low latency, distributed counters, consistency, and abuse prevention.",
    },
    archPreview: {
      nodes: [
        { id: "c", label: "Client", systemType: "client" },
        { id: "edge", label: "Edge Node", systemType: "gateway" },
        { id: "rl", label: "Rate Limiter", systemType: "service" },
        { id: "redis", label: "Redis Cluster", systemType: "cache" },
        { id: "api", label: "Upstream API", systemType: "external" },
      ],
      edges: [
        { from: "c", to: "edge" },
        { from: "edge", to: "rl" },
        { from: "rl", to: "redis" },
        { from: "rl", to: "api" },
      ],
    },
  },
  {
    problem: {
      id: "file-storage",
      title: "Design a File Storage System",
      difficulty: "Intermediate",
      description:
        "Design a cloud file storage service like Google Drive or Dropbox with upload, sync, sharing, and versioning.",
      tags: ["Object Storage", "Chunking", "Sync"],
      estimatedMinutes: 35,
      examples: ["Google Drive", "Dropbox", "OneDrive"],
    },
    requirements: [
      "Upload files up to 5GB with chunked multipart upload",
      "Delta sync \u2014 only transfer changed blocks",
      "File versioning with rollback support",
      "Shared folder permissions with ACL",
      "Full-text search across file metadata",
    ],
    practiceSkills: ["Chunked upload", "Content-addressable storage", "Delta sync", "Object storage (S3)", "Metadata indexing"],
    systemProfile: {
      scale: "200M Users",
      throughput: "1k Uploads/sec",
      latency: "N/A (Throughput focus)",
      storage: "100EB (Exabytes)",
      systemType: "Write-heavy",
      recommendedStack: ["Object Storage", "CDN", "PostgreSQL", "Chunking"],
      interviewGuidance: "Focus on uploads, metadata, replication, access control, and large file retrieval.",
    },
    archPreview: {
      nodes: [
        { id: "c", label: "Client", systemType: "client" },
        { id: "api", label: "Upload API", systemType: "gateway" },
        { id: "chunk", label: "Chunk Service", systemType: "service" },
        { id: "s3", label: "Object Store", systemType: "external" },
        { id: "meta", label: "Metadata DB", systemType: "db" },
        { id: "idx", label: "Search Index", systemType: "cache" },
      ],
      edges: [
        { from: "c", to: "api" },
        { from: "api", to: "chunk" },
        { from: "chunk", to: "s3" },
        { from: "chunk", to: "meta" },
        { from: "meta", to: "idx" },
      ],
    },
  },
  {
    problem: {
      id: "notification-system",
      title: "Design a Notification System",
      difficulty: "Intermediate",
      description:
        "Design a multi-channel notification system supporting push, email, SMS, and in-app notifications at scale.",
      tags: ["Event-Driven", "Queue", "Fanout"],
      estimatedMinutes: 30,
      examples: ["Firebase Cloud Messaging", "SendGrid", "Twilio"],
    },
    requirements: [
      "Deliver push, email, SMS, and in-app notifications",
      "Priority queues (critical alerts vs marketing)",
      "Rate limiting per user to prevent spam",
      "Delivery receipts and retry on failure",
      "User preference management per channel",
    ],
    practiceSkills: ["Priority queues", "Fan-out patterns", "Retry with backoff", "Multi-channel delivery", "User preference systems"],
    systemProfile: {
      scale: "500M Users",
      throughput: "100k Messages/sec",
      latency: "< 1s (Critical)",
      storage: "200TB (Logs)",
      systemType: "Distributed infra",
      recommendedStack: ["Kafka", "Redis", "PostgreSQL", "FCM/APNs"],
      interviewGuidance: "Focus on fanout, delivery guarantees, retries, user preferences, and rate limits.",
    },
    archPreview: {
      nodes: [
        { id: "svc", label: "Event Source", systemType: "service" },
        { id: "q", label: "Priority Queue", systemType: "queue" },
        { id: "fan", label: "Fan-out Service", systemType: "service" },
        { id: "push", label: "Push Worker", systemType: "worker" },
        { id: "email", label: "Email Worker", systemType: "worker" },
        { id: "db", label: "User Prefs DB", systemType: "db" },
      ],
      edges: [
        { from: "svc", to: "q" },
        { from: "q", to: "fan" },
        { from: "fan", to: "push" },
        { from: "fan", to: "email" },
        { from: "fan", to: "db" },
      ],
    },
  },
  // \u2500\u2500\u2500 Advanced Challenges \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  {
    problem: {
      id: "search-autocomplete",
      title: "Design a Search Autocomplete System",
      difficulty: "Advanced",
      description:
        "Design a low-latency autocomplete system like Google or Amazon that returns ranked search suggestions as users type, supporting high QPS, prefix caching, and personalized results.",
      tags: ["Trie", "Ranking", "Caching", "Low Latency", "High QPS"],
      estimatedMinutes: 45,
      examples: ["Google Search", "Amazon", "YouTube", "LinkedIn"],
    },
    requirements: [
      "Return ranked suggestions as users type (<100ms latency)",
      "Support top-K ranked and trending suggestions",
      "Cache popular prefixes in Redis",
      "Log user queries and clicks for ranking improvements",
      "Support personalized and typo-tolerant suggestions",
    ],
    practiceSkills: ["Trie / prefix indexing", "Low-latency API design", "Ranking strategies", "Hot key handling", "Analytics pipeline"],
    systemProfile: {
      scale: "2B Global Users",
      throughput: "1M+ RPS",
      latency: "< 20ms (Typing)",
      storage: "1PB (Trie Data)",
      systemType: "Real-time",
      recommendedStack: ["Trie", "Redis", "Elasticsearch", "Kafka"],
      interviewGuidance: "Focus on low-latency suggestions, ranking, prefix indexing, and freshness.",
    },
    archPreview: {
      nodes: [
        { id: "c", label: "Client", systemType: "client" },
        { id: "api", label: "API Gateway", systemType: "gateway" },
        { id: "auto", label: "Autocomplete Svc", systemType: "service" },
        { id: "redis", label: "Redis Cache", systemType: "cache" },
        { id: "trie", label: "Trie / Prefix Index", systemType: "db" },
        { id: "rank", label: "Ranking Service", systemType: "service" },
        { id: "log", label: "Query Log Pipeline", systemType: "queue" },
        { id: "store", label: "Search Index Store", systemType: "db" },
      ],
      edges: [
        { from: "c", to: "api" },
        { from: "api", to: "auto" },
        { from: "auto", to: "redis" },
        { from: "auto", to: "trie" },
        { from: "auto", to: "rank" },
        { from: "c", to: "log" },
        { from: "log", to: "store" },
        { from: "store", to: "trie" },
      ],
    },
  },
  {
    problem: {
      id: "distributed-job-scheduler",
      title: "Design a Distributed Job Scheduler",
      difficulty: "Advanced",
      description:
        "Design a cron-like distributed scheduler that runs one-time and recurring jobs reliably across workers, with retry logic, failure recovery, and duplicate prevention.",
      tags: ["Scheduling", "Workers", "Queues", "Fault Tolerance", "Distributed Systems"],
      estimatedMinutes: 50,
      examples: ["Airflow", "Kubernetes CronJobs", "Celery Beat", "Quartz"],
    },
    requirements: [
      "Create and execute one-time and recurring cron-like jobs",
      "Distribute execution across a horizontal worker pool",
      "Retry failed jobs with configurable backoff",
      "Prevent duplicate execution via distributed locking",
      "Track status, history, and execution logs per job",
    ],
    practiceSkills: ["Cron scheduling model", "Worker coordination", "Distributed locking", "Retry & dead-letter queues", "Idempotency"],
    systemProfile: {
      scale: "100k Developers",
      throughput: "50k Jobs/min",
      latency: "< 100ms (Trigger)",
      storage: "50TB (History)",
      systemType: "Distributed infra",
      recommendedStack: ["Kafka", "Worker Queues", "PostgreSQL", "Redis"],
      interviewGuidance: "Focus on retries, idempotency, worker coordination, leases, and fault tolerance.",
    },
    archPreview: {
      nodes: [
        { id: "c", label: "Admin Dashboard", systemType: "client" },
        { id: "api", label: "API Gateway", systemType: "gateway" },
        { id: "sched", label: "Scheduler Service", systemType: "service" },
        { id: "lock", label: "Leader Election", systemType: "service" },
        { id: "db", label: "Job Metadata DB", systemType: "db" },
        { id: "q", label: "Job Queue", systemType: "queue" },
        { id: "w", label: "Worker Pool", systemType: "worker" },
        { id: "dlq", label: "Dead Letter Queue", systemType: "queue" },
      ],
      edges: [
        { from: "c", to: "api" },
        { from: "api", to: "sched" },
        { from: "sched", to: "lock" },
        { from: "sched", to: "db" },
        { from: "sched", to: "q" },
        { from: "q", to: "w" },
        { from: "w", to: "db" },
        { from: "w", to: "dlq" },
      ],
    },
  },
  {
    problem: {
      id: "video-streaming-platform",
      title: "Design a Video Streaming Platform",
      difficulty: "Advanced",
      description:
        "Design a global video platform like YouTube or Netflix supporting uploads, multi-quality transcoding, CDN delivery, adaptive bitrate streaming, and analytics.",
      tags: ["CDN", "Streaming", "Encoding", "Caching", "Distributed Systems"],
      estimatedMinutes: 50,
      examples: ["YouTube", "Netflix", "Twitch", "Vimeo"],
    },
    requirements: [
      "Support large video uploads via chunked multipart upload",
      "Transcode videos into multiple qualities (360p\u20134K)",
      "Deliver video globally via CDN with adaptive bitrate",
      "Track views, likes, comments, and engagement analytics",
      "Handle viral traffic spikes without quality degradation",
    ],
    practiceSkills: ["Object storage design", "Transcoding pipeline", "CDN strategy", "Adaptive bitrate streaming", "Analytics at scale"],
    systemProfile: {
      scale: "2B+ Users",
      throughput: "5M Concurrent",
      latency: "< 2s (Start)",
      storage: "1000PB (Videos)",
      systemType: "Read-heavy",
      recommendedStack: ["CDN", "Object Storage", "Kafka", "Transcoding Workers"],
      interviewGuidance: "Focus on video ingestion, transcoding, CDN delivery, buffering, and playback latency.",
    },
    archPreview: {
      nodes: [
        { id: "c", label: "Web / Mobile Client", systemType: "client" },
        { id: "api", label: "API Gateway", systemType: "gateway" },
        { id: "upload", label: "Upload Service", systemType: "service" },
        { id: "s3", label: "Object Storage", systemType: "external" },
        { id: "q", label: "Message Queue", systemType: "queue" },
        { id: "tc", label: "Transcoding Workers", systemType: "worker" },
        { id: "meta", label: "Metadata Service", systemType: "service" },
        { id: "cdn", label: "CDN", systemType: "external" },
      ],
      edges: [
        { from: "c", to: "api" },
        { from: "api", to: "upload" },
        { from: "upload", to: "s3" },
        { from: "upload", to: "q" },
        { from: "q", to: "tc" },
        { from: "tc", to: "s3" },
        { from: "api", to: "meta" },
        { from: "c", to: "cdn" },
        { from: "cdn", to: "s3" },
      ],
    },
  },
];

// Flat list for backwards-compat
export const problems = problemMeta.map((m) => m.problem);

export function getProblemMeta(id: string): ProblemMeta | undefined {
  return problemMeta.find((m) => m.problem.id === id);
}

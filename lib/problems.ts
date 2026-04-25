// lib/problems.ts
// Extended problem data with architecture previews, requirements, and practice skills.
// This is the single source of truth for the /problems page.

import type { Problem } from "@/lib/types";

export interface ArchPreviewNode {
  id: string;
  label: string;
  type: "client" | "gateway" | "service" | "cache" | "db" | "queue" | "worker" | "external";
}

export interface ArchPreviewEdge {
  from: string;
  to: string;
}

export interface ProblemMeta {
  problem: Problem;
  requirements: string[];
  practiceSkills: string[];
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
    archPreview: {
      nodes: [
        { id: "c", label: "Client", type: "client" },
        { id: "cdn", label: "CDN", type: "external" },
        { id: "api", label: "API Gateway", type: "gateway" },
        { id: "svc", label: "URL Service", type: "service" },
        { id: "cache", label: "Redis", type: "cache" },
        { id: "db", label: "PostgreSQL", type: "db" },
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
    archPreview: {
      nodes: [
        { id: "c", label: "Client", type: "client" },
        { id: "ws", label: "WS Gateway", type: "gateway" },
        { id: "chat", label: "Chat Service", type: "service" },
        { id: "q", label: "Kafka", type: "queue" },
        { id: "w", label: "Fan-out Worker", type: "worker" },
        { id: "db", label: "Cassandra", type: "db" },
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
    archPreview: {
      nodes: [
        { id: "c", label: "Client", type: "client" },
        { id: "api", label: "API Gateway", type: "gateway" },
        { id: "ord", label: "Order Service", type: "service" },
        { id: "loc", label: "Location Service", type: "service" },
        { id: "q", label: "Event Bus", type: "queue" },
        { id: "db", label: "PostgreSQL", type: "db" },
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
    archPreview: {
      nodes: [
        { id: "c", label: "Client", type: "client" },
        { id: "edge", label: "Edge Node", type: "gateway" },
        { id: "rl", label: "Rate Limiter", type: "service" },
        { id: "redis", label: "Redis Cluster", type: "cache" },
        { id: "api", label: "Upstream API", type: "external" },
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
      "Delta sync — only transfer changed blocks",
      "File versioning with rollback support",
      "Shared folder permissions with ACL",
      "Full-text search across file metadata",
    ],
    practiceSkills: ["Chunked upload", "Content-addressable storage", "Delta sync", "Object storage (S3)", "Metadata indexing"],
    archPreview: {
      nodes: [
        { id: "c", label: "Client", type: "client" },
        { id: "api", label: "Upload API", type: "gateway" },
        { id: "chunk", label: "Chunk Service", type: "service" },
        { id: "s3", label: "Object Store", type: "external" },
        { id: "meta", label: "Metadata DB", type: "db" },
        { id: "idx", label: "Search Index", type: "cache" },
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
    archPreview: {
      nodes: [
        { id: "svc", label: "Event Source", type: "service" },
        { id: "q", label: "Priority Queue", type: "queue" },
        { id: "fan", label: "Fan-out Service", type: "service" },
        { id: "push", label: "Push Worker", type: "worker" },
        { id: "email", label: "Email Worker", type: "worker" },
        { id: "db", label: "User Prefs DB", type: "db" },
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
];

// Flat list for backwards-compat
export const problems = problemMeta.map((m) => m.problem);

export function getProblemMeta(id: string): ProblemMeta | undefined {
  return problemMeta.find((m) => m.problem.id === id);
}

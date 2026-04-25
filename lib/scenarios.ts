import type { Problem } from "@/lib/types";

export const problems: Problem[] = [
  {
    id: "url-shortener",
    title: "Design a URL Shortener",
    difficulty: "Beginner",
    description:
      "Design a scalable URL shortener like bit.ly with low-latency reads, high availability, and analytics tracking.",
    tags: ["Hashing", "Key-Value Store", "CDN"],
    estimatedMinutes: 25,
    examples: ["bit.ly", "TinyURL", "t.co"],
  },
  {
    id: "real-time-chat",
    title: "Design a Real-Time Chat App",
    difficulty: "Intermediate",
    description:
      "Design a messaging platform like Slack or WhatsApp supporting presence, delivery receipts, and group chats.",
    tags: ["WebSockets", "Pub/Sub", "Message Queue"],
    estimatedMinutes: 35,
    examples: ["WhatsApp", "Slack", "Discord"],
  },
  {
    id: "food-delivery",
    title: "Design a Food Delivery Platform",
    difficulty: "Intermediate",
    description:
      "Design a platform like DoorDash with restaurants, customers, drivers, live order tracking, and payments.",
    tags: ["Geolocation", "Microservices", "Event-Driven"],
    estimatedMinutes: 40,
    examples: ["DoorDash", "Uber Eats", "Zomato"],
  },
  {
    id: "rate-limiter",
    title: "Design a Distributed Rate Limiter",
    difficulty: "Advanced",
    description:
      "Design a distributed rate limiter for APIs handling millions of requests per second with token bucket or sliding window algorithms.",
    tags: ["Distributed Systems", "Redis", "Algorithms"],
    estimatedMinutes: 30,
    examples: ["Stripe", "Cloudflare", "Kong API Gateway"],
  },
  {
    id: "file-storage",
    title: "Design a File Storage System",
    difficulty: "Intermediate",
    description:
      "Design a cloud file storage service like Google Drive or Dropbox with upload, sync, sharing, and versioning.",
    tags: ["Object Storage", "Chunking", "Sync"],
    estimatedMinutes: 35,
    examples: ["Google Drive", "Dropbox", "OneDrive"],
  },
  {
    id: "notification-system",
    title: "Design a Notification System",
    difficulty: "Intermediate",
    description:
      "Design a multi-channel notification system supporting push, email, SMS, and in-app notifications at scale.",
    tags: ["Event-Driven", "Queue", "Fanout"],
    estimatedMinutes: 30,
    examples: ["Firebase Cloud Messaging", "SendGrid", "Twilio"],
  },
];

export function getProblem(id: string): Problem | undefined {
  return problems.find((p) => p.id === id);
}

// Legacy alias — kept so existing imports don't break during migration
/** @deprecated Use `problems` and `getProblem` */
export const scenarios = problems;
/** @deprecated Use `getProblem` */
export const getScenario = getProblem;

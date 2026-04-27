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
  {
    id: "search-autocomplete",
    title: "Design a Search Autocomplete System",
    difficulty: "Advanced",
    description:
      "Design a low-latency autocomplete system like Google or Amazon that returns ranked search suggestions as users type, supporting high QPS, prefix caching, and personalized results.",
    tags: ["Trie", "Ranking", "Caching", "Low Latency", "High QPS"],
    estimatedMinutes: 45,
    examples: ["Google Search", "Amazon", "YouTube", "LinkedIn"],
  },
  {
    id: "distributed-job-scheduler",
    title: "Design a Distributed Job Scheduler",
    difficulty: "Advanced",
    description:
      "Design a cron-like distributed scheduler that runs one-time and recurring jobs reliably across workers, with retry logic, failure recovery, and duplicate prevention.",
    tags: ["Scheduling", "Workers", "Queues", "Fault Tolerance", "Distributed Systems"],
    estimatedMinutes: 50,
    examples: ["Airflow", "Kubernetes CronJobs", "Celery Beat", "Quartz"],
  },
  {
    id: "video-streaming-platform",
    title: "Design a Video Streaming Platform",
    difficulty: "Advanced",
    description:
      "Design a global video platform like YouTube or Netflix supporting uploads, multi-quality transcoding, CDN delivery, adaptive bitrate streaming, and analytics.",
    tags: ["CDN", "Streaming", "Encoding", "Caching", "Distributed Systems"],
    estimatedMinutes: 50,
    examples: ["YouTube", "Netflix", "Twitch", "Vimeo"],
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

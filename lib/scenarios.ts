export interface Scenario {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
}

export const scenarios: Scenario[] = [
  {
    id: "uber",
    title: "Design Uber",
    difficulty: "Advanced",
    description: "Design a ride-sharing service handling real-time geolocation, driver matching, and surge pricing.",
  },
  {
    id: "twitter-feed",
    title: "Design Twitter Feed",
    difficulty: "Intermediate",
    description: "Design a highly scalable news feed supporting millions of active users and celebrity fanout.",
  },
  {
    id: "netflix",
    title: "Design Netflix",
    difficulty: "Advanced",
    description: "Design a global video streaming platform with heavy CDN usage and personalized recommendations.",
  },
  {
    id: "whatsapp",
    title: "Design WhatsApp",
    difficulty: "Intermediate",
    description: "Design a real-time messaging system supporting online users, delivery status, and message history.",
  },
  {
    id: "url-shortener",
    title: "Design a URL Shortener",
    difficulty: "Beginner",
    description: "Design a scalable URL shortener like bit.ly with low latency reads and high availability.",
  },
  {
    id: "rate-limiter",
    title: "Design a Rate Limiter",
    difficulty: "Advanced",
    description: "Design a distributed rate limiter for APIs handling millions of requests per day.",
  },
  {
    id: "food-delivery",
    title: "Design a Food Delivery App",
    difficulty: "Intermediate",
    description: "Design a platform with restaurants, customers, drivers, live order tracking, and payments.",
  },
  {
    id: "web-crawler",
    title: "Design a Web Crawler",
    difficulty: "Advanced",
    description: "Design a distributed web crawler that can scrape billions of web pages efficiently.",
  },
];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

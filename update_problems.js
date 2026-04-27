const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'lib/problems.ts'), 'utf8');

// Update Interface
content = content.replace(
  /export interface SystemProfile \{[\s\S]*?\}/,
  `export interface SystemProfile {
  scale: string;
  throughput: string;
  latency: string;
  storage: string;
  systemType: string;
  recommendedStack: string[];
  interviewGuidance: string;
}`
);

// Generic rename
content = content.replace(/users: /g, 'scale: ');
content = content.replace(/qps: /g, 'throughput: ');
content = content.replace(/type: /g, 'systemType: ');

// Hardcoded specific updates
const updates = {
  'url-shortener': {
    stack: '["CDN", "Redis", "PostgreSQL", "Base62"]',
    guidance: '"Focus on read-heavy redirects, caching, collision handling, and analytics tradeoffs."'
  },
  'real-time-chat': {
    stack: '["WebSockets", "Kafka", "Redis", "Cassandra"]',
    guidance: '"Focus on real-time delivery, ordering, fanout, presence, and message persistence."'
  },
  'food-delivery': {
    stack: '["PostgreSQL", "Redis", "Kafka", "Maps API", "WebSockets"]',
    guidance: '"Focus on geo-matching, live location updates, dispatch latency, and payment consistency."'
  },
  'rate-limiter': {
    stack: '["Redis", "Lua Scripts", "Token Bucket", "gRPC"]',
    guidance: '"Focus on ultra-low latency, distributed counters, consistency, and abuse prevention."'
  },
  'file-storage': {
    stack: '["Object Storage", "CDN", "PostgreSQL", "Chunking"]',
    guidance: '"Focus on uploads, metadata, replication, access control, and large file retrieval."'
  },
  'notification-system': {
    stack: '["Kafka", "Redis", "PostgreSQL", "FCM/APNs"]',
    guidance: '"Focus on fanout, delivery guarantees, retries, user preferences, and rate limits."'
  },
  'search-autocomplete': {
    stack: '["Trie", "Redis", "Elasticsearch", "Kafka"]',
    guidance: '"Focus on low-latency suggestions, ranking, prefix indexing, and freshness."'
  },
  'distributed-job-scheduler': {
    stack: '["Kafka", "Worker Queues", "PostgreSQL", "Redis"]',
    guidance: '"Focus on retries, idempotency, worker coordination, leases, and fault tolerance."'
  },
  'video-streaming-platform': {
    stack: '["CDN", "Object Storage", "Kafka", "Transcoding Workers"]',
    guidance: '"Focus on video ingestion, transcoding, CDN delivery, buffering, and playback latency."'
  }
};

let problemRegex = /id:\s*"([^"]+)"[\s\S]*?systemProfile:\s*\{([^}]*)\}/g;
let match;
let modifiedContent = content;

while ((match = problemRegex.exec(content)) !== null) {
  const problemId = match[1];
  const profileBody = match[2];
  if (updates[problemId]) {
    let newProfileBody = profileBody
      .replace(/recommendedStack:\s*\[[^\]]*\],/, 'recommendedStack: ' + updates[problemId].stack + ',')
      .replace(/interviewGuidance:\s*"[^"]*",?/, 'interviewGuidance: ' + updates[problemId].guidance + ',');
    
    modifiedContent = modifiedContent.replace(profileBody, newProfileBody);
  }
}

fs.writeFileSync(path.join(__dirname, 'lib/problems.ts'), modifiedContent);
console.log('Updated lib/problems.ts');

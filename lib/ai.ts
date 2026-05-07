/**
 * Robustly extracts a JSON object from a string that may contain markdown or other filler text.
 */
export function extractJSON<T>(raw: string): T {
  // 1. Remove <think>...</think> blocks if present (DeepSeek models sometimes output this)
  let cleanedRaw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // 2. Remove markdown code block syntax if present
  cleanedRaw = cleanedRaw.replace(/```(?:json)?/gi, "").replace(/```/g, "");

  // Find the first '{' and last '}'
  const start = cleanedRaw.indexOf("{");
  const end = cleanedRaw.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("No valid JSON object found in AI response");
  }

  const jsonStr = cleanedRaw.substring(start, end + 1);
  
  try {
    return JSON.parse(jsonStr) as T;
  } catch (err) {
    // If simple parsing fails, try to clean up common issues like trailing commas
    const cleaned = jsonStr
      .replace(/,\s*([\]}])/g, "$1") // Remove trailing commas
      .replace(/(\r\n|\n|\r)/gm, ""); // Remove newlines
      
    try {
      return JSON.parse(cleaned) as T;
    } catch (innerErr) {
      console.error("Failed to parse JSON even after cleanup:", jsonStr);
      throw new Error("Malformed JSON in AI response");
    }
  }
}

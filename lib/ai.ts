/**
 * Robustly extracts a JSON object from a string that may contain markdown or other filler text.
 */
export function extractJSON<T>(raw: string): T {
  // Find the first '{' and last '}'
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("No valid JSON object found in AI response");
  }

  const jsonStr = raw.substring(start, end + 1);
  
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

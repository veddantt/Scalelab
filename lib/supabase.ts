/**
 * @deprecated Use `lib/supabase/client.ts` for browser components
 * or `lib/supabase/server.ts` for API routes / server components.
 *
 * This legacy client is kept for backward compatibility with the
 * existing share page (`/share/[uuid]`).
 */
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

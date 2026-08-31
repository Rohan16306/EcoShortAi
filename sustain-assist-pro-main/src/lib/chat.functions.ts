import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: any[];
};

export const loadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("messages")
      .select("id, role, parts, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const out: StoredMessage[] = (data ?? []).map((row) => ({
      id: row.id,
      role: row.role as StoredMessage["role"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parts: row.parts as any[],
    }));
    return out;
  });

const SaveSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      parts: z.array(z.any()),
    }),
  ),
});

export const saveMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SaveSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (data.messages.length === 0) return { ok: true };
    const rows = data.messages.map((m) => ({
      user_id: context.userId,
      role: m.role,
      parts: m.parts as unknown as never,
    }));
    const { error } = await context.supabase.from("messages").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("messages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

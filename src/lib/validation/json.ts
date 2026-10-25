import type * as z from "zod/mini";

export function parseJson<Output>(raw: string | null | undefined, schema: z.ZodMiniType<Output>): Output | null {
    if (!raw) return null;
    try {
        const data: unknown = JSON.parse(raw);
        const result = schema.safeParse(data);
        return result.success ? result.data : null;
    } catch {
        return null;
    }
}

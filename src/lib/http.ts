import type * as z from "zod/mini";

export async function fetchJson<Output>(url: URL, schema: z.ZodMiniType<Output>, timeout: number): Promise<Output> {
    const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) throw new Error(`${url.host} a répondu HTTP ${response.status}`);
    const data: unknown = await response.json();
    return schema.parse(data);
}

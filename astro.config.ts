import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { site } from "./src/data/site";

const requestBodySizeLimit = 8 * 1024;

export default defineConfig({
    site: site.url,
    adapter: node({ mode: "standalone", bodySizeLimit: requestBodySizeLimit }),
    trailingSlash: "never",
    compressHTML: true,
    build: {
        format: "preserve"
    },
    vite: {
        plugins: [
            tailwindcss(),
            {
                name: "bundle-server-dependencies",
                apply: "build",
                config: () => ({ ssr: { noExternal: true, external: ["sharp"] } })
            }
        ]
    },
    markdown: {
        syntaxHighlight: false
    },
    prefetch: {
        prefetchAll: true,
        defaultStrategy: "hover"
    },
    integrations: [react(), sitemap({ lastmod: new Date(), filter: (page) => !page.includes("/nuit") })],
    security: {
        allowedDomains: [{ hostname: new URL(site.url).hostname, protocol: "https" }],
        csp: {
            directives: [
                "default-src 'self'",
                "img-src 'self'",
                "connect-src 'self'",
                "manifest-src 'self'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests"
            ]
        }
    },
    fonts: [
        {
            provider: fontProviders.fontsource(),
            name: "Signika",
            cssVariable: "--font-signika",
            weights: ["500 700"],
            styles: ["normal"],
            subsets: ["latin"],
            fallbacks: ["sans-serif"]
        },
        {
            provider: fontProviders.fontsource(),
            name: "Heebo",
            cssVariable: "--font-heebo",
            weights: ["400 600"],
            styles: ["normal"],
            subsets: ["latin"],
            fallbacks: ["sans-serif"]
        }
    ]
});
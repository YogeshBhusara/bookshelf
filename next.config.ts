import type { NextConfig } from "next";

// Pin the workspace root to this project's directory. A stray lockfile in a
// parent folder otherwise makes Turbopack infer the wrong root, which breaks
// the RSC client manifest (global-error.js) and asset resolution.
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // pdf.js relies on browser globals (DOMMatrix, etc.) and is only ever used in
  // the browser. Keep it out of the server bundle so SSR never evaluates it.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;

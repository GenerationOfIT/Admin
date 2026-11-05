import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keeps visited pages in the browser for 30 seconds, so going back to a
    // list is instant (Next 15+ default is 0). Every save action calls
    // revalidatePath, which clears this cache, so an admin never sees their
    // own edits missing; changes made elsewhere (another admin, new orders)
    // can show up to 30 seconds late.
    staleTimes: { dynamic: 30 },
  },
  // The panel must never appear in search results, including pages a
  // crawler reaches before robots.txt applies.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

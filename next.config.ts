import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbopack-কে প্রজেক্ট রুট স্পষ্ট করে দেওয়া — নইলে Windows-এ "Next.js package not found" panic হয়ে
  // HMR প্রতিবার পুরো পেজ রিলোড করে (হোম পেজ ইনফিনিট রিফ্রেশ)
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;

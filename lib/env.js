export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export const GIPHY_API_KEY =
  process.env.NEXT_PUBLIC_GIPHY_API_KEY || "dc6zaTOxFJmzC";

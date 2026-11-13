import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #059669 0%, #047857 55%, #134e4a 100%)",
          borderRadius: 40,
        }}
      >
        <svg
          width="112"
          height="112"
          viewBox="0 0 32 32"
          fill="none"
        >
          <path
            d="M15.5 6.5L17.9 13.1L24.5 15.5L17.9 17.9L15.5 24.5L13.1 17.9L6.5 15.5L13.1 13.1Z"
            fill="#ffffff"
          />
          <circle cx="23.5" cy="8.5" r="2.1" fill="#f43f5e" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}

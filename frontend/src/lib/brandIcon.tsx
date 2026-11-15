import { ImageResponse } from "next/og";

/**
 * Generates SorkariPath's emerald-and-sparkle PNG icon for Apple touch and PWA manifests.
 */
export function renderBrandIconResponse(pixelSize: number, maskable = false) {
  const iconInnerSize = Math.round(pixelSize * (maskable ? 0.54 : 0.62));
  const radius = maskable ? 0 : Math.round(pixelSize * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #059669 0%, #047857 55%, #134e4a 100%)",
          borderRadius: radius,
        }}
      >
        <svg
          width={iconInnerSize}
          height={iconInnerSize}
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
      width: pixelSize,
      height: pixelSize,
    }
  );
}

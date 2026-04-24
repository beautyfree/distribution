import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "distribution — where to post your side-project";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAFAFA",
          color: "#0F0F0F",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "#FF5C00",
              color: "#FFFFFF",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            d
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.01em" }}>
            distribution
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              maxWidth: 960,
            }}
          >
            Where to post your side-project.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 64, height: 4, background: "#FF5C00" }} />
            <div style={{ fontSize: 26, color: "#6B6B6B", maxWidth: 900 }}>
              An open registry of communities where AI builders ship and share.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "#6B6B6B",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <div>telegram · reddit · discord · directories</div>
          <div>distribution-tau.vercel.app</div>
        </div>
      </div>
    ),
    size,
  );
}

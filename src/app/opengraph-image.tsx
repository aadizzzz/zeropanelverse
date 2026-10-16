import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "ZeroPanelVerse — Anime, Manga & Manhwa Perspective Archive";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0c0c0c",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #202020 2%, transparent 0%), radial-gradient(circle at 75px 75px, #171717 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "#f0f0f0",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          border: "12px solid #1c1c1c",
        }}
      >
        {/* Top Header Badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "#ffffff",
                color: "#0c0c0c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              0P
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                fontSize: "28px",
                fontWeight: 900,
                letterSpacing: "1px",
              }}
            >
              <span>ZeroPanel</span>
              <span style={{ color: "#737373" }}>Verse</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "13px",
              letterSpacing: "3px",
              color: "#a3a3a3",
              border: "1px solid #333333",
              padding: "6px 16px",
            }}
          >
            ARCHIVE · V0.9
          </div>
        </div>

        {/* Main Hero Typography */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: "58px",
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
            }}
          >
            <div style={{ display: "flex" }}>Anime, Manga & Manhwa</div>
            <div
              style={{
                display: "flex",
                color: "#ffffff",
                borderBottom: "4px solid #ffffff",
                alignSelf: "flex-start",
              }}
            >
              Through Every Perspective.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "22px",
              color: "#a3a3a3",
              lineHeight: 1.4,
              maxWidth: "850px",
            }}
          >
            Franchise chronology trees, spoiler-safe community panels, and custom
            guides engineered for beginner, mediocre, and elite audiences.
          </div>
        </div>

        {/* Bottom Tracks Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #262626",
            paddingTop: "24px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "#171717",
                border: "1px solid #333333",
                padding: "8px 18px",
                fontSize: "14px",
                color: "#e5e5e5",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              BEGINNER TRACK
            </div>
            <div
              style={{
                display: "flex",
                backgroundColor: "#171717",
                border: "1px solid #333333",
                padding: "8px 18px",
                fontSize: "14px",
                color: "#e5e5e5",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              MEDIOCRE TRACK
            </div>
            <div
              style={{
                display: "flex",
                backgroundColor: "#171717",
                border: "1px solid #333333",
                padding: "8px 18px",
                fontSize: "14px",
                color: "#e5e5e5",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              ELITE TRACK
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "16px",
              color: "#737373",
              letterSpacing: "1px",
            }}
          >
            zeropanelverse.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The NEXUS "N" monogram, drawn as an app icon (white squircle, black glyph). */
export default function Icon() {
  const s = 180;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ width: s * 0.74, height: s * 0.74, borderRadius: s * 0.2, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={s * 0.42} height={s * 0.42} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 18.5V5.5l11 13v-13" />
          </svg>
        </div>
      </div>
    ),
    size
  );
}

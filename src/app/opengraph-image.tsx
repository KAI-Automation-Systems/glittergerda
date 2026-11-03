import { ImageResponse } from "next/og";

export const alt = "GlitterGerda — maak je eigen glitterplaatje";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#18051d",
          background:
            "linear-gradient(135deg, #8f22db, #ff2ba6 52%, #ff7426)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: 1050,
            display: "flex",
            flexDirection: "column",
            border: "12px solid #18051d",
            boxShadow: "22px 22px 0 #18051d",
            background: "#fff8da",
            padding: "54px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "#b90069",
              fontSize: 42,
              fontWeight: 900,
            }}
          >
            GLITTERGERDA
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 76,
              lineHeight: 0.95,
              fontWeight: 900,
              letterSpacing: -4,
              textTransform: "uppercase",
            }}
          >
            Maak je eigen glitterplaatje.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            Geen prompts. Geen gedoe. Wel echte bewegende glitter.
          </div>
        </div>
      </div>
    ),
    size
  );
}

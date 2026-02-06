import React, { useMemo } from "react";
import { ARTIST_STYLES } from "@/src/data/artistStyle";

type Show = {
  day: 1 | 2;
  date: string;
  stage: string;
  artist: string;
  time: string;
};

export type PosterVariant = "day1" | "day2" | "all";

type Props = {
  variant: PosterVariant;
  selectedShows: Show[];
  instagram?: string; // opcional
};

function getArtistStyle(name: string) {
  const key = name.trim().toUpperCase();
  return (
    ARTIST_STYLES[key] ?? {
      colorClass: "text-white",
    }
  );
}

function uniqueArtists(shows: Show[]) {
  const map = new Map<string, string>(); // KEY -> display name
  for (const s of shows) {
    const key = s.artist.trim().toUpperCase();
    if (!map.has(key)) map.set(key, s.artist.trim());
  }
  return Array.from(map.values());
}

function bgForVariant(variant: PosterVariant) {
  // ✅ estos 3 fondos van en /public con estos nombres exactos
  if (variant === "day1") return "/MI GRILLA 14 DE FEB.png";
  if (variant === "day2") return "/MI GRILLA 15 DE FEB.png";
  return "/MI GRILLA GLOBAL.png";
}

function fontSizeForCount(n: number) {
  // ✅ bastante grande para ocupar el centro y leerse bien
  if (n <= 8) return 90;
  if (n <= 10) return 82;
  if (n <= 14) return 70;
  if (n <= 18) return 62;
  if (n <= 24) return 54;
  if (n <= 32) return 48;
  return 42;
}

export default function ExportPoster({
  variant,
  selectedShows,
  instagram,
}: Props) {
  const bg = bgForVariant(variant);

  const artists = useMemo(() => {
    return uniqueArtists(selectedShows).sort((a, b) => a.localeCompare(b, "es"));
  }, [selectedShows]);

  const fs = fontSizeForCount(artists.length);

  const ig = (instagram ?? "").replace(/@/g, "").trim(); // ✅ safe

  return (
    <div
      className="relative text-white"
      style={{
        width: 1080,
        height: 1920,
        overflow: "hidden",
        backgroundColor: "#000", // fallback
      }}
    >
      {/* ✅ Fondo como IMG (Safari lo renderiza bien) */}
      <img
        src={bg}
        alt=""
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* ZONA ARTISTAS */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 480,
          bottom: 280,
          paddingLeft: 110,
          paddingRight: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {artists.length === 0 ? (
          <div
            style={{
              fontFamily: "var(--font-cosquin)",
              fontSize: 64,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              opacity: 0.9,
              textAlign: "center",
              textShadow: "0 2px 18px rgba(0,0,0,0.45)",
            }}
          >
            Elegí artistas para armar tu grilla
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              maxWidth: "92%",
            }}
          >
            {artists.map((name) => {
              const st = getArtistStyle(name);

              return (
                <span
                  key={name}
                  className={st.colorClass}
                  style={{
                    fontFamily: "var(--font-cosquin)",
                    fontSize: fs,
                    lineHeight: 1.05,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    textShadow: "0 2px 18px rgba(0,0,0,0.45)",
                    display: "inline-block", // ✅ iOS safe
                    margin: "0 14px 18px", // ✅ reemplaza gap/rowGap
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* IG ABAJO (en el margen del rectángulo) */}
      {ig.length > 0 && (
        <div
          className="absolute left-0 right-0 text-center"
          style={{
            bottom: 155,
            fontFamily: "var(--font-circular)",
            fontSize: 34,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 3px 18px rgba(0,0,0,0.55)",
            zIndex: 10,
          }}
        >
          @{ig}
        </div>
      )}
    </div>
  );
}
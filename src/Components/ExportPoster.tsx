import React, { useMemo } from "react";
import { ARTIST_STYLES } from "@/src/data/artistStyle";
import bg14 from "@/public/mi-grilla-14.png";
import bg15 from "@/public/mi-grilla-15.png";
import bgAll from "@/public/mi-grilla-global.png";

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
  instagram?: string;
};

function bgForVariant(variant: PosterVariant) {
  if (variant === "day1") return bg14.src;
  if (variant === "day2") return bg15.src;
  return bgAll.src;
}

function scaleFromSizeClass(sizeClass?: string) {
  switch (sizeClass) {
    case "cr-s-40":
      return 1.20; // headliners
    case "cr-s-34":
      return 1.10;
    case "cr-s-32":
      return 1.05;
    case "cr-s-28":
      return 0.80;
    default:
      return 0.80;
  }
}

function getArtistStyle(name: string) {
  const key = name.trim().toUpperCase();
  return (
    ARTIST_STYLES[key] ?? {
      colorClass: "text-white",
      sizeClass: "cr-s-32", // 👈 default para que SIEMPRE exista
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

function fontSizeForCount(n: number) {
  if (n <= 8) return 110;
  if (n <= 10) return 100;
  if (n <= 14) return 88;
  if (n <= 18) return 80;
  if (n <= 24) return 70;
  if (n <= 32) return 66;
  return 60;
}

export default function ExportPoster({ variant, selectedShows, instagram }: Props) {
  const artists = useMemo(() => {
    return uniqueArtists(selectedShows).sort((a, b) => a.localeCompare(b, "es"));
  }, [selectedShows]);

  const fs = fontSizeForCount(artists.length);
  const bg = bgForVariant(variant);
  const ig = (instagram ?? "").replace(/@/g, "").trim();

  return (
    <div
      className="relative text-white"
      style={{
        width: 1080,
        height: 1920,
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* Fondo como IMG (Safari/iOS + html-to-image) */}
      <img
        src={bg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        loading="eager"
        decoding="sync"
      />

      {/* ZONA ARTISTAS */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 420,
          bottom: 280,
          paddingLeft: 110,
          paddingRight: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
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
              textShadow: "0 2px 18px rgba(0,0,0,0.25)",
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
              const scale = scaleFromSizeClass(st.sizeClass);
              const finalSize = Math.round(fs * scale); // 👈 importante: entero (mejor render/export)
              const marginBottom = Math.max(8, Math.round(finalSize * 0.18)); // 👈 baja “interlineado” real

              return (
                <span
                  key={name}
                  className={st.colorClass}
                  style={{
                    fontFamily: "var(--font-cosquin)",
                    fontSize: finalSize,
                    lineHeight: 0.95, // 👈 más “apretado”
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    textShadow: "0 2px 18px rgba(0,0,0,0.25)",
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    margin: `0 14px ${marginBottom}px`, // 👈 menos aire vertical
                  }}
                >
                  {name}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* IG ABAJO */}
      {ig.length > 0 && (
        <div
          className="absolute left-0 right-0 text-center"
          style={{
            bottom: 200,
            fontFamily: "var(--font-Meloriac)",
            fontSize: 55,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 3px 18px rgba(0,0,0,0.25)",
            zIndex: 2,
          }}
        >
          @{ig}
        </div>
      )}
       <div
  className="absolute left-0 right-0 text-center"
  style={{
    bottom: 120,
    fontFamily: "var(--font-circular)",
    fontSize: 30,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.85)",
    textShadow: "0 3px 18px rgba(0,0,0,0.25)",
    zIndex: 2,
    lineHeight: 1.3,
  }}
>
  <div>Creá tu grilla en</div>
  <div style={{ fontWeight: 700, fontStyle: "italic" }}>
    www.grillacosquinrock.com
  </div>
</div>
    </div>
  );
}

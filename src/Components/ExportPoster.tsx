import React, { useMemo } from "react";
import { ARTIST_STYLES } from "@/src/data/artistStyle";
import bg14 from "@/public/mi-grilla-14.png";
import bg15 from "@/public/mi-grilla-15.png";
import bgAll from "@/public/mi-grilla-global.png";

function bgForVariant(variant: PosterVariant) {
  if (variant === "day1") return bg14.src;
  if (variant === "day2") return bg15.src;
  return bgAll.src;
}

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

  const ig = (instagram ?? "").replace(/@/g, "").trim(); // safe

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
      {/* ✅ Fondo como IMG (soluciona Safari/iOS + html-to-image) */}
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
          top: 480,
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
              // ✅ importante: NO usar gap/rowGap en iOS export
              // ✅ y NO usar flex-wrap en el contenedor; dejamos inline-block en spans
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
                    textShadow: "0 2px 18px rgba(0,0,0,0.25)",

                    display: "inline-block",
                    whiteSpace: "nowrap",
                    margin: "0 14px 18px",
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
            bottom: 155,
            fontFamily: "var(--font-circular)",
            fontSize: 34,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            textShadow: "0 3px 18px rgba(0,0,0,0.25)",
            zIndex: 2,
          }}
        >
          @{ig}
        </div>
      )}
    </div>
  );
}
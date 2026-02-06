"use client";

import React, { useMemo } from "react";
import { ARTIST_STYLES } from "@/src/data/artistStyle";

type Show = {
  day: 1 | 2;
  date: string;
  stage: string;
  artist: string;
  time: string;
};

type PosterVariant = "day1" | "day2" | "all";

type Props = {
  variant: PosterVariant;
  selectedShows: Show[];
  instagram: string; // 👈 nuevo
};


function getArtistStyle(name: string) {
  const key = name.trim().toUpperCase();
  return (
    ARTIST_STYLES[key] ?? {
      colorClass: "text-white",
      sizeClass: "",
    }
  );
}

function uniqueArtists(shows: Show[]) {
  const set = new Map<string, string>(); // KEY -> display name
  for (const s of shows) {
    const key = s.artist.trim().toUpperCase();
    if (!set.has(key)) set.set(key, s.artist.trim());
  }
  return Array.from(set.values());
}

function bgForVariant(variant: PosterVariant) {
  // ✅ estos 3 fondos van en /public con estos nombres exactos
  if (variant === "day1") return "/MI GRILLA 14 DE FEB.png";
  if (variant === "day2") return "/MI GRILLA 15 DE FEB.png";
  return "/MI GRILLA GLOBAL.png";
}

function fontSizeForCount(n: number) {
  // ✅ más agresivo para que ocupe ~70% del contenedor y se lea bien
  if (n <= 8) return 90;
  if (n <= 10) return 82;
  if (n <= 14) return 70;
  if (n <= 18) return 62;
  if (n <= 24) return 54;
  if (n <= 32) return 48;
  return 42;
}

export default function ExportPoster({ variant, selectedShows, instagram }: Props) {
  const artists = useMemo(() => {
    return uniqueArtists(selectedShows).sort((a, b) => a.localeCompare(b, "es"));
  }, [selectedShows]);

  const fs = fontSizeForCount(artists.length);

  return (
   <div
    className="relative text-white"
    style={{
      width: 1080,
      height: 1920,

      // 👇 FONDO CORRECTO PARA EXPORT (mobile-safe)
      backgroundImage: `url(${bgForVariant(variant)})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
      backgroundPosition: "center",

      // 👇 MUY IMPORTANTE PARA iOS
      backgroundColor: "#000000",
    }}
  >
    <div className="relative z-10">
      {/* ZONA ARTISTAS: centrada y ocupando ~70% */}
      <div
        className="absolute left-0 right-0"
        style={{
          // ✅ si alguna vez querés ajustar “donde cae” el bloque:
          top: 480,
          bottom: 280,
          paddingLeft: 110,
          paddingRight: 110,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
            }}
          >
            Elegí artistas para armar tu grilla
          </div>
        ) : (
          <div
            className="flex flex-wrap justify-center items-center text-center"
            style={{
              maxWidth: "92%",
              // ✅ más aire pero sin achicar demasiado el bloque
              rowGap: 18,
              columnGap: 26,
              alignContent: "center",
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
      </div>
      {/* IG ABAJO (en el margen del rectángulo) */}
{instagram?.trim() && (
  <div
    className="absolute left-0 right-0 text-center"
    style={{
      // ✅ ajustá finito si lo querés más arriba/abajo
      bottom: 155,
      fontFamily: "var(--font-circular)",
      fontSize: 34,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.85)",
      textShadow: "0 3px 18px rgba(0,0,0,0.55)",
    }}
  >
    @{instagram}
  </div>
)}

    </div>
  );
}

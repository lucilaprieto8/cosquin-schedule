import React, { useMemo } from "react";
import { ARTIST_STYLES } from "@/src/data/artistStyle";

type Show = {
  day: 1 | 2;
  date: string;
  stage: string;
  artist: string;
  time: string;
};

type PosterVariant = "day1" | "day2" | "grid";

type Props = {
  variant: PosterVariant;
  selectedShows: Show[];
  backgroundUrl?: string; // por ahora tu mismo bg, después lo cambiás por día
};

function getArtistStyle(name: string) {
  const key = name.trim().toUpperCase();
  return (
    ARTIST_STYLES[key] ?? {
      colorClass: "text-white",
      sizeClass: "text-[28px]",
    }
  );
}

function uniqueByArtist(shows: Show[]) {
  const map = new Map<string, Show>();
  for (const s of shows) {
    const k = s.artist.trim().toUpperCase();
    if (!map.has(k)) map.set(k, s);
  }
  return Array.from(map.values());
}

function getHeaderTexts(variant: PosterVariant) {
  if (variant === "day1") {
    return {
      topKicker: "MI 14 DE FEBRERO EN COSQUÍN",
      bigTitle: "COSQUÍN",
      sub: "AERÓDROMO SANTA MARÍA DE PUNILLA",
    };
  }
  if (variant === "day2") {
    return {
      topKicker: "MI 15 DE FEBRERO EN COSQUÍN",
      bigTitle: "COSQUÍN",
      sub: "AERÓDROMO SANTA MARÍA DE PUNILLA",
    };
  }
  return {
    topKicker: "MI GRILLA DE COSQUÍN",
    bigTitle: "COSQUÍN",
    sub: "AERÓDROMO SANTA MARÍA DE PUNILLA",
  };
}

export default function ExportPoster({
  variant,
  selectedShows,
  backgroundUrl = "/bg-cosquin.png",
}: Props) {
  const { topKicker, bigTitle, sub } = useMemo(() => getHeaderTexts(variant), [variant]);

  const artists = useMemo(() => {
    const uniq = uniqueByArtist(selectedShows);
    return uniq.map((s) => s.artist).sort((a, b) => a.localeCompare(b, "es"));
  }, [selectedShows]);

  return (
    <div
      className="relative overflow-hidden text-white"
      style={{
        width: 1080,
        height: 1920,
        backgroundImage: `url('${backgroundUrl}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* overlay para legibilidad (tipo story) */}
      <div className="absolute inset-0 bg-[#081735]/55" />
      <div className="absolute inset-0 bg-black/10" />

      {/* contenido */}
      <div className="relative h-full px-[84px] pt-[120px]">
        {/* logo arriba */}
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Cosquín Rock"
            className="h-[170px] w-auto object-contain"
            draggable={false}
          />
        </div>

        {/* header tipográfico */}
        <div className="mt-10 text-center">
          <div
            className="text-[26px] uppercase tracking-[0.18em] text-white/90"
            style={{ fontFamily: "var(--font-circular)" }}
          >
            {topKicker}
          </div>

          <div
            className="mt-8 text-[122px] leading-none tracking-[0.18em]"
            style={{ fontFamily: "var(--font-meloriac)" }}
          >
            {bigTitle}
          </div>

          <div
            className="mt-4 text-[26px] uppercase tracking-[0.12em] text-white/85"
            style={{ fontFamily: "var(--font-circular)" }}
          >
            {sub}
          </div>
        </div>

        {/* lista / word cloud */}
        <div className="mt-14">
          {artists.length === 0 ? (
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-10 text-center">
              <div
                className="text-[34px] tracking-wide"
                style={{ fontFamily: "var(--font-circular)" }}
              >
                Armá tu grilla
              </div>
              <div
                className="mt-2 text-[22px] tracking-wide text-white/80"
                style={{ fontFamily: "var(--font-circular)" }}
              >
                Elegí tus shows y exportá tu póster.
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-3">
                {artists.map((name) => {
                  const st = getArtistStyle(name);
                  return (
                    <span
                      key={name}
                      className={[
                        "uppercase font-black leading-none",
                        "cr-shadow",
                        "tracking-wide",
                        st.colorClass,
                        st.sizeClass,
                      ].join(" ")}
                      style={{ fontFamily: "var(--font-cosquin)" }}
                    >
                      {name},
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* footer logo abajo (como tu ejemplo actual) */}
        <div className="absolute bottom-[72px] left-0 right-0 px-[84px]">
          <div className="flex items-center justify-center gap-4">
            <div className="h-[10px] w-[10px] rounded-full bg-white/70" />
            <img
              src="/logoh.png"
              alt="Cosquín Rock 2026"
              className="h-[120px] w-auto object-contain"
              draggable={false}
            />
            <div className="h-[10px] w-[10px] rounded-full bg-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

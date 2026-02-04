import React, { useMemo } from "react";
import { ARTIST_STYLES } from "@/src/data/artistStyle";

type Show = {
  day: 1 | 2;
  date: string;
  stage: string;
  artist: string;
  time: string;
};

type Props = {
  dayLabel: string; // "Día 1" / "Día 2"
  dateLabel: string; // "2026-02-14" o "14 FEB"
  venueLabel?: string; // "AERÓDROMO SANTA MARÍA DE PUNILLA"
  selectedShows: Show[]; // solo lo elegido por el usuario
};

function getArtistStyle(name: string) {
  const key = name.trim().toUpperCase();
  return (
    ARTIST_STYLES[key] ?? {
      colorClass: "text-white",
      sizeClass: "text-[30px]",
    }
  );
}

function uniqueByArtist(shows: Show[]) {
  const map = new Map<string, Show>();
  for (const s of shows) {
    const key = s.artist.trim().toUpperCase();
    if (!map.has(key)) map.set(key, s);
  }
  return Array.from(map.values());
}

export default function ExportPoster({
  dayLabel,
  dateLabel,
  venueLabel = "AERÓDROMO SANTA MARÍA DE PUNILLA",
  selectedShows,
}: Props) {
  const artists = useMemo(() => {
    const uniq = uniqueByArtist(selectedShows);
    return uniq.map((s) => s.artist).sort((a, b) => a.localeCompare(b, "es"));
  }, [selectedShows]);

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        padding: 64,
        paddingTop: 120,
        backgroundImage: "url('/bg-cosquin.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative text-white font-cosquin"
    >
      {/* Header */}
      <div className="flex items-start justify-center">
        {/* Día + fecha */}
        <div className="text-center">
          <div className="inline-block rounded-full bg-white/15 px-6 py-2 text-[32px] font-semibold uppercase tracking-wider">
            {dayLabel}
          </div>

          <div className="mt-2 text-[96px] font-black leading-none tracking-widest">
            {dateLabel}
          </div>

          <div className="mt-2 text-[32px] uppercase tracking-wider opacity-90">
            {venueLabel}
          </div>
        </div>
      </div>

      {/* Word cloud */}
      <div className="mt-[54px]">
        {artists.length === 0 ? (
          <div className="rounded-[28px] bg-white/10 p-10 text-center">
            <div className="text-[34px] tracking-wide">Armá tu schedule</div>
            <div className="mt-2 text-[22px] tracking-wide opacity-80">
              Elegí tus shows y exportá tu póster.
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {artists.map((name) => {
              const style = getArtistStyle(name);

              return (
                <span
                  key={name}
                  className={[
                    "uppercase font-black leading-none",
                    "tracking-wide", // <- más “poster”, menos apretado
                    "cr-shadow",
                    style.colorClass,
                    style.sizeClass,
                  ].join(" ")}
                >
                  {name},
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-[56px] left-0 right-0 px-[64px]">
        <div className="flex items-center justify-center gap-3">
          <div className="h-[10px] w-[10px] rounded-full bg-white/70" />
          <div className="h-50 w-100">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="h-[10px] w-[10px] rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}

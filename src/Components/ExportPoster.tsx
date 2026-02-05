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
  venueLabel?: string;
  selectedShows: Show[];
  bgUrl?: string; // default: "/bg-cosquin.png"
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

function headerLabel(variant: PosterVariant) {
  if (variant === "day1") return "MI 14 DE FEBRERO EN COSQUÍN";
  if (variant === "day2") return "MI 15 DE FEBRERO EN COSQUÍN";
  return "MI GRILLA DE COSQUÍN";
}

function dateBig(variant: PosterVariant) {
  if (variant === "day1") return "14 FEBRERO";
  if (variant === "day2") return "15 FEBRERO";
  return "14 Y 15 FEBRERO";
}

export default function ExportPoster({
  variant,
  venueLabel = "AERÓDROMO SANTA MARÍA DE PUNILLA",
  selectedShows,
  bgUrl = "/bg-cosquin.png",
}: Props) {
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
        backgroundImage: `url('${bgUrl}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* wrapper de centrado real */}
      <div className="absolute inset-0 flex flex-col items-center justify-between px-[64px] py-[110px] padding-top-[150px]">
        {/* ====== CARD AREA ====== */}
        <div className="relative w-full">
          {/* LOGO (pisando el card) */}
          <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[55%]">
            <img
              src="/logo.png"
              alt="Cosquín Rock 2026"
              className="h-[220px] w-auto object-contain drop-shadow-[0_20px_0_rgba(0,0,0,0.25)]"
            />
          </div>

          {/* CARD */}
          <div className="relative mx-auto w-full rounded-[44px] bg-[#0e2f61]/92 px-[68px] pt-[150px] pb-[72px] shadow-[0_40px_80px_rgba(0,0,0,0.35)]">
            {/* “zapatos” laterales */}
            <div className="pointer-events-none absolute left-[-34px] top-[120px]">
              <img src="/zapatoI.png" alt="" className="h-[110px] w-auto" />
            </div>
            <div className="pointer-events-none absolute right-[-34px] top-[120px] scale-x-[-1]">
              <img src="/zapatoD.png" alt="" className="h-[110px] w-auto" />
            </div>

            {/* HEADERS dentro del card */}
            <div className="text-center">
              <div
                className="text-[20px] uppercase tracking-[0.22em] text-white/85"
                style={{ fontFamily: "var(--font-circular)" }}
              >
                {venueLabel}
              </div>

              <div
                className="mt-5 text-[72px] leading-none tracking-[0.12em]"
                style={{ fontFamily: "var(--font-cosquin)" }}
              >
                {dateBig(variant)}
              </div>

              <div
                className="mt-6 text-[18px] uppercase tracking-[0.26em] text-white/90"
                style={{ fontFamily: "var(--font-circular)" }}
              >
                {headerLabel(variant)}
              </div>
            </div>

            {/* ARTISTAS */}
            <div className="mt-12">
              {artists.length === 0 ? (
                <div className="rounded-[28px] bg-white/10 p-12 text-center">
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
                <div className="mx-auto flex max-w-[860px] flex-wrap justify-center gap-x-5 gap-y-3 text-center">
                  {artists.map((name) => {
                    const style = getArtistStyle(name);

                    return (
                      <span
                        key={name}
                        className={[
                          "uppercase font-black leading-none",
                          "tracking-wide",
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
          </div>
        </div>

        {/* ====== FOOTER TEXT ====== */}
        <div
          className="text-center text-[16px] uppercase tracking-[0.20em] text-white/55"
          style={{ fontFamily: "var(--font-circular)" }}
        >
          • COSQUÍN ROCK 2026 •
        </div>
      </div>
    </div>
  );
}
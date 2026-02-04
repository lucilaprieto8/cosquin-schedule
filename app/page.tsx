"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import day1 from "@/src/data/day1.json";
import day2 from "@/src/data/day2.json";

type Show = {
  day: 1 | 2;
  date: string; // "2026-02-14"
  stage: string;
  artist: string;
  time: string; // "HH:MM"
};

type DayKey = 1 | 2;

type Slot = {
  time: string;
  shows: Show[];
};

type Selection = {
  // key = time, value = list of selected option keys (including "FREE")
  [time: string]: string[];
};

const STORAGE_KEY = "cosquin_schedule_v1";

function showKey(s: Show) {
  return `${s.day}|${s.time}|${s.stage}|${s.artist}`;
}

function timeToSortMinutes(time: string) {
  // sorts after-midnight times to the end (00:00–05:59 treated as 24:xx)
  const [hhStr, mmStr] = time.split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  const base = hh * 60 + mm;
  return hh < 6 ? base + 24 * 60 : base;
}

function uniqSortedTimes(shows: Show[]) {
  const set = new Set(shows.map((s) => s.time));
  return Array.from(set).sort((a, b) => timeToSortMinutes(a) - timeToSortMinutes(b));
}

function groupByTime(shows: Show[]): Slot[] {
  const by: Record<string, Show[]> = {};
  for (const s of shows) {
    by[s.time] = by[s.time] || [];
    by[s.time].push(s);
  }
  const times = Object.keys(by).sort((a, b) => timeToSortMinutes(a) - timeToSortMinutes(b));
  return times.map((time) => ({
    time,
    shows: by[time].sort((a, b) => a.stage.localeCompare(b.stage)),
  }));
}

function loadSelection(): Record<string, Selection> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveSelection(all: Record<string, Selection>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function formatDayLabel(day: DayKey) {
  return day === 1 ? "Día 1" : "Día 2";
}

function stageBadge(stage: string) {
  // simple styling per stage family (podés tunear después)
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs leading-none";
  const map: Record<string, string> = {
    Norte: "border-white/20 bg-white/10",
    Sur: "border-white/20 bg-white/10",
    "La Casita del Blues": "border-white/20 bg-white/10",
    Montaña: "border-white/20 bg-white/10",
    Boomerang: "border-white/20 bg-white/10",
    Paraguay: "border-white/20 bg-white/10",
    Electronic: "border-white/20 bg-white/10",
    Sorpresa: "border-white/20 bg-white/10",
  };
  return `${base} ${map[stage] ?? "border-white/20 bg-white/10"}`;
}

export default function Page() {
  
  const allShows: Show[] = useMemo(() => {
    // @ts-ignore
    return [...(day1 as Show[]), ...(day2 as Show[])];
  }, []);

  const [day, setDay] = useState<DayKey>(1);
  const [openTime, setOpenTime] = useState<string | null>(null);

  const dayShows = useMemo(() => allShows.filter((s) => s.day === day), [allShows, day]);
  const slots = useMemo(() => groupByTime(dayShows), [dayShows]);

  const [allSelection, setAllSelection] = useState<Record<string, Selection>>({});
  const selection: Selection = allSelection[String(day)] ?? {};

  // load saved selections
  useEffect(() => {
    const loaded = loadSelection();
    setAllSelection(loaded);
  }, []);

  // persist selections
  useEffect(() => {
    saveSelection(allSelection);
  }, [allSelection]);

  function toggleOption(time: string, optionKey: string) {
    setAllSelection((prev) => {
      const next = { ...prev };
      const dayKey = String(day);
      const daySel: Selection = { ...(next[dayKey] ?? {}) };
      const current = new Set(daySel[time] ?? []);

      // if choosing FREE, clear others
      if (optionKey === "FREE") {
        if (current.has("FREE")) {
          current.delete("FREE");
        } else {
          current.clear();
          current.add("FREE");
        }
      } else {
        // if choosing any show, remove FREE
        current.delete("FREE");
        if (current.has(optionKey)) current.delete(optionKey);
        else current.add(optionKey);
      }

      daySel[time] = Array.from(current);
      next[dayKey] = daySel;
      return next;
    });
  }

  function clearDay() {
    setAllSelection((prev) => {
      const next = { ...prev };
      next[String(day)] = {};
      return next;
    });
  }

  const posterRef = useRef<HTMLDivElement | null>(null);

  async function downloadPNG() {
  if (!posterRef.current) return;

  const dataUrl = await htmlToImage.toPng(posterRef.current, {
    width: 1080,
    height: 1920,
    backgroundColor: "#0b0b10",
    pixelRatio: 1
  });

  const link = document.createElement("a");
  link.download = `mi-cosquin-dia-${day}.png`;
  link.href = dataUrl;
  link.click();
}

async function downloadPDF() {
  if (!posterRef.current) return;

  const dataUrl = await htmlToImage.toPng(posterRef.current, {
    width: 1080,
    height: 1920,
    backgroundColor: "#0b0b10",
    pixelRatio: 1
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [1080, 1920]
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, 1080, 1920);
  pdf.save(`mi-cosquin-dia-${day}.pdf`);
}


  const dayDate = useMemo(() => {
    const sample = dayShows[0]?.date;
    if (!sample) return day === 1 ? "2026-02-14" : "2026-02-15";
    return sample;
  }, [dayShows, day]);

  const times = useMemo(() => uniqSortedTimes(dayShows), [dayShows]);

  function selectedSummaryForTime(time: string) {
    const keys = selection[time] ?? [];
    if (keys.includes("FREE")) return [{ label: "Libre", stage: "" }];

    const timeShows = dayShows.filter((s) => s.time === time);
    const picked = timeShows.filter((s) => keys.includes(showKey(s)));
    return picked.map((s) => ({ label: s.artist, stage: s.stage }));
  }

  const openSlot = slots.find((s) => s.time === openTime) ?? null;

  return (
    <div className="min-h-dvh bg-[#0b0b10] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0b10]/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <div className="text-sm text-white/70">Cosquín Rock</div>
            <div className="text-lg font-semibold">Mi schedule</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDay(1)}
              className={[
                "rounded-full px-3 py-1 text-sm",
                day === 1 ? "bg-white text-black" : "bg-white/10 text-white",
              ].join(" ")}
            >
              Día 1
            </button>
            <button
              onClick={() => setDay(2)}
              className={[
                "rounded-full px-3 py-1 text-sm",
                day === 2 ? "bg-white text-black" : "bg-white/10 text-white",
              ].join(" ")}
            >
              Día 2
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-6 lg:grid-cols-2">
        {/* left: selector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/70">{formatDayLabel(day)}</div>
              <div className="text-base text-white/90">{dayDate}</div>
            </div>

            <button
              onClick={clearDay}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
            >
              Limpiar día
            </button>
          </div>

          <div className="space-y-2">
            {slots.map((slot) => {
              const picked = selectedSummaryForTime(slot.time);
              return (
                <button
                  key={slot.time}
                  onClick={() => setOpenTime(slot.time)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-base font-semibold">{slot.time}</div>
                    <div className="flex flex-wrap justify-end gap-1">
                      {picked.length === 0 ? (
                        <span className="text-sm text-white/50">Sin elegir</span>
                      ) : (
                        picked.map((p, idx) => (
                          <span key={idx} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                            {p.label}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-white/60">
                      Opciones: {slot.shows.length + 1} (incluye Libre)
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
            Tip: podés elegir más de un show por horario. Si marcás “Libre”, se limpian las otras opciones de ese horario.
          </div>
        </section>

        {/* right: poster preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">Preview para export</div>
            <div className="text-xs text-white/50">(export lo sumamos en el próximo paso)</div>
          </div>

          <div
            ref={posterRef}
            className="mx-auto aspect-[9/16] w-full max-w-[420px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-white/70">Mi Cosquín Rock 2026</div>
                <div className="text-xl font-semibold">{formatDayLabel(day)}</div>
                <div className="text-sm text-white/70">{dayDate}</div>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                <div className="text-xs text-white/70">Nombre</div>
                <div className="text-sm text-white/90">Luci</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {times.map((t) => {
                const keys = selection[t] ?? [];
                const isFree = keys.includes("FREE");
                const timeShows = dayShows.filter((s) => s.time === t);
                const pickedShows = isFree
                  ? []
                  : timeShows.filter((s) => keys.includes(showKey(s)));

                return (
                  <div key={t} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold">{t}</div>

                      <div className="flex flex-1 flex-col items-end gap-1">
                        {keys.length === 0 ? (
                          <div className="text-sm text-white/50">Sin elegir</div>
                        ) : isFree ? (
                          <div className="text-sm">Libre</div>
                        ) : (
                          pickedShows.map((s) => (
                            <div key={showKey(s)} className="flex items-center gap-2 text-sm">
                              <span className={stageBadge(s.stage)}>{s.stage}</span>
                              <span className="text-white/90">{s.artist}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-white/60">
              Horarios sujetos a cambios.
            </div>
          </div>

         <div className="grid grid-cols-2 gap-2">

  {/* Poster oculto SOLO para export */}
<div className="fixed left-[-9999px] top-0">
  <div
    ref={posterRef}
    style={{ width: 1080, height: 1920 }}
    className="bg-[#0b0b10] p-16 text-white"
  >
    {/* CONTENIDO DEL POSTER EXPORT */}
    <div className="text-sm opacity-70">Mi Cosquín Rock 2026</div>
    <div className="text-3xl font-bold">{formatDayLabel(day)}</div>
    <div className="mb-6 text-sm opacity-70">{dayDate}</div>

    <div className="space-y-4">
      {times
        .filter((t) => {
          const sel = selection[t];
          return sel && sel.length > 0;
        })
        .map((t) => {
          const keys = selection[t];
          const isFree = keys.includes("FREE");
          const picked = dayShows.filter(
            (s) => s.time === t && keys.includes(showKey(s))
          );

          return (
            <div
              key={t}
              className="rounded-xl bg-white/10 p-4"
            >
              <div className="mb-2 text-lg font-semibold">{t}</div>

              {isFree ? (
                <div className="text-base opacity-80">Libre</div>
              ) : (
                picked.map((s) => (
                  <div key={showKey(s)} className="text-base">
                    <span className="opacity-70">{s.stage}</span> — {s.artist}
                  </div>
                ))
              )}
            </div>
          );
        })}
    </div>

    <div className="mt-8 text-xs opacity-60">
      Horarios sujetos a cambios
    </div>
  </div>
</div>


  <button
    onClick={downloadPNG}
    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
  >
    Descargar PNG (Stories)
  </button>

  <button
    onClick={downloadPDF}
    className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
  >
    Descargar PDF
  </button>
</div>

<div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
  Tip: en Instagram, subí el PNG como Story y guardalo como destacado. Si querés fondo de pantalla, te armo otra export size.
</div>

        </section>
      </main>

      {/* bottom sheet modal */}
      {openSlot && (
        <div className="fixed inset-0 z-40">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpenTime(null)}
          />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-4xl rounded-t-3xl border border-white/10 bg-[#0b0b10] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white/70">Elegir para</div>
                <div className="text-lg font-semibold">{openSlot.time}</div>
              </div>
              <button
                onClick={() => setOpenTime(null)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {/* FREE option */}
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">Opción</span>
                  <span className="text-sm">Libre / descanso</span>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={(selection[openSlot.time] ?? []).includes("FREE")}
                  onChange={() => toggleOption(openSlot.time, "FREE")}
                />
              </label>

              {/* shows */}
              {openSlot.shows.map((s) => {
                const key = showKey(s);
                const checked = (selection[openSlot.time] ?? []).includes(key);
                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={stageBadge(s.stage)}>{s.stage}</span>
                        <span className="text-sm">{s.artist}</span>
                      </div>
                      <div className="text-xs text-white/60">{s.time}</div>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={checked}
                      onChange={() => toggleOption(openSlot.time, key)}
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-4 pb-2 text-xs text-white/60">
              Multi-select activo. Si querés que sea “solo una opción”, lo cambiamos en 2 líneas.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

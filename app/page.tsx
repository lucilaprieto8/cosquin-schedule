"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import day1 from "@/src/data/day1.json";
import day2 from "@/src/data/day2.json";
import ExportPoster from "@/src/Components/ExportPoster";



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

function toHourKey(time: string) {
  // "14:30" -> "14:00"
  const [hh] = time.split(":");
  return `${hh}:00`;
}

function hourSortMinutes(hourKey: string) {
  // "00:00" al final
  const [hhStr] = hourKey.split(":");
  const hh = Number(hhStr);
  const base = hh * 60;
  return hh < 6 ? base + 24 * 60 : base;
}

function groupByHour(shows: Show[]): Slot[] {
  const by: Record<string, Show[]> = {};
  for (const s of shows) {
    const key = toHourKey(s.time);
    by[key] = by[key] || [];
    by[key].push(s);
  }

  const keys = Object.keys(by).sort((a, b) => hourSortMinutes(a) - hourSortMinutes(b));

  return keys.map((time) => ({
    time,
    shows: by[time].sort((a, b) => a.time.localeCompare(b.time) || a.stage.localeCompare(b.stage)),
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
  const slots = useMemo(() => groupByHour(dayShows), [dayShows]);

  const [allSelection, setAllSelection] = useState<Record<string, Selection>>({});
  const selection: Selection = allSelection[String(day)] ?? {};

const selectedShows = useMemo(() => {
  const result: Show[] = [];

  for (const slot of slots) {
    const t = slot.time;
    const keys = selection[t] ?? [];
    if (keys.length === 0) continue;
    if (keys.includes("FREE")) continue;

    for (const s of slot.shows) {
      if (keys.includes(showKey(s))) result.push(s);
    }
  }

  return result;
}, [slots, selection]);


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

const posterRefDay1 = useRef<HTMLDivElement | null>(null);
const posterRefDay2 = useRef<HTMLDivElement | null>(null);
const posterRefAll = useRef<HTMLDivElement | null>(null);

function getSelectedShowsForDay(dayKey: DayKey): Show[] {
  const dayKeyStr = String(dayKey);
  const daySel: Selection = allSelection[dayKeyStr] ?? {};

  const showsForDay = allShows.filter((s) => s.day === dayKey);
  const daySlots = groupByHour(showsForDay);

  const result: Show[] = [];

  for (const slot of daySlots) {
    const keys = daySel[slot.time] ?? [];
    if (keys.length === 0) continue;
    if (keys.includes("FREE")) continue;

    for (const s of slot.shows) {
      if (keys.includes(showKey(s))) result.push(s);
    }
  }

  return result;
}

const selectedShowsDay1 = useMemo(() => getSelectedShowsForDay(1), [allSelection, allShows]);
const selectedShowsDay2 = useMemo(() => getSelectedShowsForDay(2), [allSelection, allShows]);

const selectedShowsAll = useMemo(() => {
  // ExportPoster ya hace uniqueByArtist, pero igual te combino ambas listas
  return [...selectedShowsDay1, ...selectedShowsDay2];
}, [selectedShowsDay1, selectedShowsDay2]);

async function exportPNGFromRef(
  ref: React.RefObject<HTMLDivElement | null>,
  filename: string
) {
  if (!ref.current) return;

  await document.fonts.ready;

  const dataUrl = await htmlToImage.toPng(ref.current, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#0b0b10",
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

async function shareDay1() {
  await exportPNGFromRef(posterRefDay1, "cosquin-dia-1.png");
}

async function shareDay2() {
   await exportPNGFromRef(posterRefDay2, "cosquin-dia-2.png");
}

async function shareAll() {
  await exportPNGFromRef(posterRefAll, "cosquin-mi-grilla.png");
}
function selectedSummaryForSlot(slot: Slot) {
  const keys = selection[slot.time] ?? [];
  if (keys.length === 0) return [];

  // si está marcado FREE, mostramos "Libre"
  if (keys.includes("FREE")) return [{ label: "Libre", stage: "" }];

  const picked = slot.shows.filter((s) => keys.includes(showKey(s)));
  return picked.map((s) => ({ label: s.artist, stage: s.stage }));
}

const openSlot = useMemo(
  () => slots.find((s) => s.time === openTime) ?? null,
  [slots, openTime]
);

return (
  <div
    className="min-h-dvh text-white"
    style={{
      backgroundImage: "url('/bg/cr-background.png')",
      backgroundRepeat: "repeat",
      backgroundSize: "960px 1920px",
      backgroundPosition: "top left",
    }}
  >
    <div className="min-h-dvh bg-black/20">
      {/* HEADER */}
      <header className="sticky top-0 z-40 mb-6 w-full">
        <div className="border-b border-white/10 bg-transparent/90 backdrop-blur">
          <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-center px-4">
            <img src="/logoh.png" alt="Cosquín Rock" className="h-9 w-auto" />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-4xl px-5 py-6">
        <div className="rounded-[32px] border border-white/10 bg-transparent p-4 backdrop-blur-md md:p-6">
          {/* TITLE STRIP */}
          <div className="border-b border-white/10">
            <div className="mx-auto max-w-6xl px-4 py-4 text-center">
              <div
                className="text-[20px] uppercase leading-tight tracking-wider text-white md:text-[28px]"
                style={{ fontFamily: "var(--font-meloriac)" }}
              >
                ARMA TU GRILLA
                <br className="hidden md:block" />
                PARA EL{" "}
                <span className="text-[#DD5227]">{day === 1 ? "14" : "15"}</span>{" "}
                DE FEBRERO
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="mb-4 mt-6 flex justify-center gap-4 md:gap-6">
            <button
              onClick={() => setDay(1)}
              className={[
                "px-6 md:px-10",
                "text-[18px] md:text-[22px] uppercase tracking-widest transition",
                day === 1
                  ? "bg-[#DD5227] text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20",
              ].join(" ")}
              style={{ fontFamily: "var(--font-circular)" }}
            >
              DÍA 1
            </button>

            <button
              onClick={() => setDay(2)}
              className={[
                "px-6 md:px-10",
                "text-[18px] md:text-[22px] uppercase tracking-widest transition",
                day === 2
                  ? "bg-[#DD5227] text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20",
              ].join(" ")}
              style={{ fontFamily: "var(--font-circular)" }}
            >
              DÍA 2
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={clearDay}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs tracking-wider text-white hover:bg-white/20"
            >
              LIMPIAR DÍA
            </button>
          </div>

          {/* GRILLA */}
          <div className="mt-4 space-y-3">
            {slots.map((slot) => {
              const picked = selectedSummaryForSlot(slot);

              return (
                <button
                  key={slot.time}
                  onClick={() => setOpenTime(slot.time)}
                  className="w-full rounded-2xl border border-white/15 bg-[#0e2f61] p-4 text-left hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="text-[18px] leading-none tracking-wider"
                      style={{ fontFamily: "var(--font-circular)" }}
                    >
                      {slot.time} – {slot.time.replace(":00", ":59")}
                    </div>

                    <div className="flex flex-wrap justify-end gap-1">
                      {picked.length === 0 ? (
                        <span className="text-xs text-white/55 tracking-wide">
                          Sin elegir
                        </span>
                      ) : (
                        <>
                          {picked.slice(0, 2).map((p, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-white/15 px-6 py-1 tracking-wider"
                              style={{
                                fontFamily: "var(--font-cosquin)",
                                fontSize: "16px",
                              }}
                            >
                              {p.label}
                            </span>
                          ))}
                          {picked.length > 2 && (
                            <span
                              className="rounded-full bg-white/15 px-6 py-1 tracking-wider"
                              style={{
                                fontFamily: "var(--font-cosquin)",
                                fontSize: "16px",
                              }}
                            >
                              +{picked.length - 2}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-white/60 tracking-wide">
                    {slot.shows.length + 1} opciones
                  </div>
                </button>
              );
            })}
          </div>

{/* SHARE BUTTONS */}
<div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 md:flex-row md:justify-center md:gap-6">
  <button
    onClick={shareDay1}
    className={[
      "px-6 md:px-10",
      "py-3",
      "text-[14px] md:text-[16px]",
      "uppercase tracking-widest",
      "transition",
      day === 1
        ? "bg-[#DD5227] text-white"
        : "bg-white/10 text-white/80 hover:bg-white/20",
    ].join(" ")}
    style={{ fontFamily: "var(--font-circular)" }}
  >
    COMPARTIR DÍA 1
  </button>

  <button
    onClick={shareDay2}
    className={[
      "px-6 md:px-10",
      "py-3",
      "text-[14px] md:text-[16px]",
      "uppercase tracking-widest",
      "transition",
      day === 2
        ? "bg-[#DD5227] text-white"
        : "bg-white/10 text-white/80 hover:bg-white/20",
    ].join(" ")}
    style={{ fontFamily: "var(--font-circular)" }}
  >
    COMPARTIR DÍA 2
  </button>

  <button
    onClick={shareAll}
    className={[
      "px-6 md:px-10",
      "py-3",
      "text-[14px] md:text-[16px]",
      "uppercase tracking-widest",
      "transition",
      "bg-[#0e7a4c] text-white hover:opacity-90",
    ].join(" ")}
    style={{ fontFamily: "var(--font-circular)" }}
  >
    COMPARTIR MI GRILLA
  </button>
</div>
        </div>
{/* POSTERS OCULTOS (para exportar PNG) */}
<div className="fixed left-[-99999px] top-0 opacity-0 pointer-events-none">
  <div ref={posterRefDay1}>
    <ExportPoster
      variant="day1"
      selectedShows={selectedShowsDay1}
      backgroundUrl="/bg-cosquin.png"
    />
  </div>

  <div ref={posterRefDay2}>
    <ExportPoster
      variant="day2"
      selectedShows={selectedShowsDay2}
      backgroundUrl="/bg-cosquin.png"
    />
  </div>

  <div ref={posterRefAll}>
    <ExportPoster
      variant="grid"
      selectedShows={selectedShowsAll}
      backgroundUrl="/bg-cosquin.png"
    />
  </div>
</div>

      </main>
      {/* MODAL */}
      {openSlot && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpenTime(null)}
          />

          <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
            <div
              className="w-full max-w-4xl rounded-3xl border border-white/15"
              style={{
                backgroundImage: "url('/bg/cr-background.png')",
                backgroundRepeat: "repeat",
                backgroundSize: "960px 960px",
              }}
            >
              <div className="rounded-3xl bg-[#0e2f61]/95">
                <div className="flex items-center justify-between border-b border-white/15 bg-[#0b2348]/70 px-5 py-4">
                  <div>
                    <div
                      className="text-xs text-white/70 tracking-wider"
                      style={{ fontFamily: "var(--font-circular)" }}
                    >
                      Elegir para
                    </div>
                    <div
                      className="text-[26px] leading-none tracking-widest text-white"
                      style={{ fontFamily: "var(--font-cosquin)" }}
                    >
                      {openSlot.time} – {openSlot.time.replace(":00", ":59")}
                    </div>
                  </div>

                  <button
                    onClick={() => setOpenTime(null)}
                    className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs tracking-wider text-white hover:bg-white/20"
                    style={{ fontFamily: "var(--font-cosquin)" }}
                  >
                    CERRAR
                  </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
                  <div className="space-y-3">
                    {/* FREE option */}
                    <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/15 bg-[#0e2f61] p-4 hover:bg-[#0e2f61]/90">
                      <div className="flex items-center gap-3">
                        <span
                          className="rounded-full bg-white/15 px-6 py-1 tracking-wider"
                          style={{
                            fontFamily: "var(--font-cosquin)",
                            fontSize: "16px",
                          }}
                        >
                          OPCIÓN
                        </span>

                        <div className="flex flex-col">
                          <span
                            className="text-[16px] tracking-wide text-white"
                            style={{ fontFamily: "var(--font-circular)" }}
                          >
                            Libre / descanso
                          </span>
                          <span className="text-xs text-white/60 tracking-wide">
                            (si lo marcás, se limpian las otras opciones)
                          </span>
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={(selection[openSlot.time] ?? []).includes("FREE")}
                          onChange={() => toggleOption(openSlot.time, "FREE")}
                        />
                        <div className="h-7 w-7 rounded-md border border-white/20 bg-white/10 peer-checked:border-[#DD5227] peer-checked:bg-[#DD5227]" />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
                          ✓
                        </div>
                      </div>
                    </label>

                    {/* shows */}
                    {openSlot.shows.map((s) => {
                      const key = showKey(s);
                      const checked = (selection[openSlot.time] ?? []).includes(key);

                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/15 bg-[#0e2f61] p-4 hover:bg-[#0e2f61]/90"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                              <span className={stageBadge(s.stage)}>{s.stage}</span>

                              <span
                                className="text-[16px] tracking-wide text-white"
                                style={{ fontFamily: "var(--font-circular)" }}
                              >
                                {s.artist}
                              </span>
                            </div>

                            <div
                              className="text-xs text-white/70 tracking-wide"
                              style={{ fontFamily: "var(--font-circular)" }}
                            >
                              {s.time}
                            </div>
                          </div>

                          <div className="relative">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={checked}
                              onChange={() => toggleOption(openSlot.time, key)}
                            />
                            <div className="h-7 w-7 rounded-md border border-white/20 bg-white/10 peer-checked:border-[#DD5227] peer-checked:bg-[#DD5227]" />
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
                              ✓
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 pb-2 text-xs text-white/60 tracking-wide">
                    Multi-select activo.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-12 mb-6 text-center text-sm tracking-wide text-white/70">
        © 2024 Cosquín Rock. Todos los derechos reservados.
      </footer>
    </div>
  </div>
);}

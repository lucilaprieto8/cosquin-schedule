"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import day1 from "@/src/data/day1.json";
import day2 from "@/src/data/day2.json";
import ExportPoster from "@/src/Components/ExportPoster";
import { jsPDF } from "jspdf";
import { transform } from "next/dist/build/swc/generated-native";
import html2canvas from "html2canvas";
import { COSQUIN_FONT, CIRCULAR_FONT, MELORIAC_FONT } from "@/src/utils/pdfFonts";


type Show = {
  day: 1 | 2;
  date: string; // "2026-02-14"
  stage: string;
  artist: string;
  time: string; // "HH:MM"
};

type DayKey = 1 | 2;

type Slot = {
  time: string; // "HH:00"
  shows: Show[];
};

type Selection = {
  [time: string]: string[];
};

const STORAGE_KEY = "cosquin_schedule_v1";

function showKey(s: Show) {
  return `${s.day}|${s.time}|${s.stage}|${s.artist}`;
}

function timeToSortMinutes(time: string) {
  const [hhStr, mmStr] = time.split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  const base = hh * 60 + mm;
  return hh < 6 ? base + 24 * 60 : base;
}

function toHourKey(time: string) {
  const [hh] = time.split(":");
  return `${hh}:00`;
}

function hourSortMinutes(hourKey: string) {
  const [hhStr] = hourKey.split(":");
  const hh = Number(hhStr);
  const base = hh * 60;
  return hh < 6 ? base + 24 * 60 : base;
}

function addOneHour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + 1);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function groupByHour(shows: Show[]): Slot[] {
  const by: Record<string, Show[]> = {};
  for (const s of shows) {
    const key = toHourKey(s.time);
    by[key] = by[key] || [];
    by[key].push(s);
  }

  const keys = Object.keys(by).sort(
    (a, b) => hourSortMinutes(a) - hourSortMinutes(b)
  );

  return keys.map((time) => ({
    time,
    shows: by[time].sort(
      (a, b) => a.time.localeCompare(b.time) || a.stage.localeCompare(b.stage)
    ),
  }));
}

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !("MSStream" in window)
  );
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

/**
 * Colores (los afinamos con el manual cuando quieras).
 * Acá los dejo sólidos para que se distingan.
 */
const STAGE_PDF: Record<string, { border: string; bg: string }> = {
  Norte: { border: "#DD5227", bg: "rgba(221,82,39,0.10)" },
  Sur: { border: "#DD5227", bg: "rgba(221,82,39,0.10)" },

  Boomerang: { border: "#7CFF5B", bg: "rgba(124,255,91,0.10)" },
  Montaña: { border: "#1AD6FF", bg: "rgba(26,214,255,0.10)" },
  "La Casita del Blues": { border: "#B46CFF", bg: "rgba(180,108,255,0.10)" },
  Electronic: { border: "#FF4D4D", bg: "rgba(255,77,77,0.10)" },
  "La Plaza Electronic Stage": {
    border: "#FF4D4D",
    bg: "rgba(255,77,77,0.10)",
  },

  Paraguay: { border: "#FFA800", bg: "rgba(255,168,0,0.10)" },
  Sorpresa: { border: "#FFA800", bg: "rgba(255,168,0,0.10)" },
};

const STAGE_THEME: Record<
  string,
  {
    cardBg: string;
    text: string;
    chip: string;
    badge: string;
    checkOn: string;
  }
> = {
  Norte: {
    cardBg: "bg-[#77B4D2]",
    text: "text-[#0b0b10]",
    chip: "bg-[#77B4D2] text-[#0b0b10]",
    badge: "border-black/20 bg-black/10 text-[#0b0b10]",
    checkOn: "peer-checked:border-[#0b0b10] peer-checked:bg-[#0b0b10]",
  },
  Sur: {
    cardBg: "bg-[#A571CF]",
    text: "text-white",
    chip: "bg-[#A571CF] text-white",
    badge: "border-white/25 bg-white/15 text-white",
    checkOn: "peer-checked:border-white peer-checked:bg-white",
  },
  "La Casita del Blues": {
    cardBg: "bg-[#DD5227]",
    text: "text-white",
    chip: "bg-[#DD5227] text-white",
    badge: "border-white/25 bg-white/15 text-white",
    checkOn: "peer-checked:border-white peer-checked:bg-white",
  },
  Montaña: {
    cardBg: "bg-[#38754A]",
    text: "text-white",
    chip: "bg-[#38754A] text-white",
    badge: "border-white/25 bg-white/15 text-white",
    checkOn: "peer-checked:border-white peer-checked:bg-white",
  },
  Boomerang: {
    cardBg: "bg-[#3D15B8]",
    text: "text-white",
    chip: "bg-[#3D15B8] text-white",
    badge: "border-white/25 bg-white/15 text-white",
    checkOn: "peer-checked:border-white peer-checked:bg-white",
  },
  Paraguay: {
    cardBg: "bg-[#377D8A]",
    text: "text-white",
    chip: "bg-[#377D8A] text-white",
    badge: "border-white/25 bg-white/15 text-white",
    checkOn: "peer-checked:border-white peer-checked:bg-white",
  },
  Electronic: {
    cardBg: "bg-[#193E85]",
    text: "text-white",
    chip: "bg-[#193E85] text-white",
    badge: "border-white/25 bg-white/15 text-white",
    checkOn: "peer-checked:border-white peer-checked:bg-white",
  },
  Sorpresa: {
    cardBg: "bg-white/15",
    text: "text-white",
    chip: "bg-white/15 text-white",
    badge: "border-white/25 bg-white/10 text-white",
    checkOn: "peer-checked:border-[#DD5227] peer-checked:bg-[#DD5227]",
  },
};

function stageTheme(stage: string) {
  return (
    STAGE_THEME[stage] ?? {
      cardBg: "bg-white/10",
      text: "text-white",
      chip: "bg-white/10 text-white",
      badge: "border-white/20 bg-white/10 text-white",
      checkOn: "peer-checked:border-[#DD5227] peer-checked:bg-[#DD5227]",
    }
  );
}

function stageBadgeClass(stage: string) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs leading-none tracking-wide";
  return `${base} ${stageTheme(stage).badge}`;
}

function slotCardClass(index: number) {
  const base =
    "w-full rounded-2xl border border-white/15 p-4 text-left transition hover:brightness-[1.06]";
  const variants = [
    "bg-[#193E85]/70",
    "bg-[#377D8A]/65",
    "bg-[#3D15B8]/55",
    "bg-[#77B4D2]/30",
  ];
  return `${base} ${variants[index % variants.length]}`;
}

export default function Page() {
  const [instagram, setInstagram] = useState<string>("");

  const allShows: Show[] = useMemo(() => {
    // @ts-ignore
    return [...(day1 as Show[]), ...(day2 as Show[])];
  }, []);

  const [day, setDay] = useState<DayKey>(1);
  const [openTime, setOpenTime] = useState<string | null>(null);

  const dayShows = useMemo(
    () => allShows.filter((s) => s.day === day),
    [allShows, day]
  );
  const slots = useMemo(() => groupByHour(dayShows), [dayShows]);

  const [allSelection, setAllSelection] = useState<Record<string, Selection>>(
    {}
  );
  const selection: Selection = allSelection[String(day)] ?? {};

function sanitizeInstagram(raw: string) {
  // sin @, permite letras, números, . y _
  return raw
    .replace(/@/g, "")
    .replace(/[^a-zA-Z0-9._]/g, "")
    .slice(0, 30);
}

  const isInstagramValid = instagram.trim().length >= 4;
  const shareDisabled = !isInstagramValid;

  useEffect(() => {
    const loaded = loadSelection();
    setAllSelection(loaded);
  }, []);

  useEffect(() => {
    saveSelection(allSelection);
  }, [allSelection]);

  function toggleOption(time: string, optionKey: string) {
    setAllSelection((prev) => {
      const next = { ...prev };
      const dayKey = String(day);
      const daySel: Selection = { ...(next[dayKey] ?? {}) };
      const current = new Set(daySel[time] ?? []);

      if (optionKey === "FREE") {
        if (current.has("FREE")) current.delete("FREE");
        else {
          current.clear();
          current.add("FREE");
        }
      } else {
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

  const selectedShowsDay1 = useMemo(
    () => getSelectedShowsForDay(1),
    [allSelection, allShows]
  );
  const selectedShowsDay2 = useMemo(
    () => getSelectedShowsForDay(2),
    [allSelection, allShows]
  );

  const selectedShowsAll = useMemo(() => {
    return [...selectedShowsDay1, ...selectedShowsDay2];
  }, [selectedShowsDay1, selectedShowsDay2]);

  async function waitForImages(el: HTMLElement) {
    const imgs = Array.from(el.querySelectorAll("img"));

    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();

        return new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        });
      })
    );
  }

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

async function exportAndShare(
  ref: React.RefObject<HTMLDivElement | null>,
  filename: string
) {
  const node = ref.current;
  if (!node) return;

  await document.fonts.ready;
  await waitForImages(node);
  await new Promise((r) => setTimeout(r, 120)); // iOS necesita un pelín más

  let blob: Blob | null = null;

  if (isIOS()) {
    // ✅ iOS: html2canvas (evita el bug de tipografías)
    const canvas = await html2canvas(node, {
      backgroundColor: "#000000",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
  } else {
    // 💻 Desktop: html-to-image
    blob = await htmlToImage.toBlob(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#000000",
    });
  }

  if (!blob) return;

  const file = new File([blob], filename, { type: "image/png" });

  // 📱 Share Sheet iOS
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Mi grilla Cosquín",
      text: "Mi grilla de Cosquín Rock 🎸",
    });
    return;
  }

  // fallback descarga
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function shareDay1() {
  await exportAndShare(posterRefDay1, "cosquin-dia-1.png");
}
async function shareDay2() {
  await exportAndShare(posterRefDay2, "cosquin-dia-2.png");
}
async function shareAll() {
  await exportAndShare(posterRefAll, "cosquin-mi-grilla.png");
}

  function selectedSummaryForSlot(slot: Slot) {
    const keys = selection[slot.time] ?? [];
    if (keys.length === 0) return [];
    if (keys.includes("FREE")) return [{ label: "Libre", stage: "" }];
    const picked = slot.shows.filter((s) => keys.includes(showKey(s)));
    return picked.map((s) => ({ label: s.artist, stage: s.stage }));
  }

  const openSlot = useMemo(
    () => slots.find((s) => s.time === openTime) ?? null,
    [slots, openTime]
  );

  function addHours(time: string, hoursToAdd: number) {
    const [hhStr, mmStr] = time.split(":");
    let hh = Number(hhStr);
    const mm = Number(mmStr);

    hh = (hh + hoursToAdd) % 24;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }

  function hourRangeLabel(hourKey: string) {
    return `${hourKey}`;
  }

  async function fetchImageAsDataURL(src: string) {
    const res = await fetch(src);
    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

type PdfRow = { time: string; stage: string; artist: string };

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

// mezcla un color sobre blanco (para “tint”)
function withAlphaOnWhite(rgb: { r: number; g: number; b: number }, a: number) {
  return {
    r: Math.round(255 * (1 - a) + rgb.r * a),
    g: Math.round(255 * (1 - a) + rgb.g * a),
    b: Math.round(255 * (1 - a) + rgb.b * a),
  };
}

function buildRowsForDay(dayKey: DayKey): PdfRow[] {
  const daySel: Selection = allSelection[String(dayKey)] ?? {};
  const showsForDay = allShows.filter((s) => s.day === dayKey);
  const daySlots = groupByHour(showsForDay);

  const rows: PdfRow[] = [];

  for (const slot of daySlots) {
    const keys = daySel[slot.time] ?? [];
    if (keys.length === 0) continue;

    // si marcó FREE en ese bloque horario, lo ponemos como una fila
    if (keys.includes("FREE")) {
      rows.push({
        time: slot.time,
        stage: "",
        artist: "Libre / descanso",
      });
      continue;
    }

    // filas por show (NO agrupado): si se repite hora, salen una abajo de otra
    const picked = slot.shows
      .filter((s) => keys.includes(showKey(s)))
      .sort((a, b) => a.time.localeCompare(b.time) || a.stage.localeCompare(b.stage, "es"));

    for (const s of picked) {
      rows.push({
        time: s.time,
        stage: s.stage,
        artist: s.artist,
      });
    }
  }

  // ✅ orden cronológico real (con after-midnight)
  return rows.sort((a, b) => timeToSortMinutes(a.time) - timeToSortMinutes(b.time));
}


async function downloadPDFItinerary() {
  const PDF_BG = "#193E85";

function paintPageBackground() {
  const { r, g, b } = hexToRgb(PDF_BG);
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F"); // llena toda la hoja
}

const doc = new jsPDF({ unit: "pt", format: "a4" });

// ===== REGISTRO DE FUENTES =====
doc.addFileToVFS("CosquinDisplay.ttf", COSQUIN_FONT);
doc.addFont("CosquinDisplay.ttf", "Cosquin", "normal");

doc.addFileToVFS("Circular.otf", CIRCULAR_FONT);
doc.addFont("Circular.otf", "Circular", "normal");
doc.addFont("Circular.otf", "Circular", "bold");

doc.addFileToVFS("Meloriac.ttf", MELORIAC_FONT);
doc.addFont("Meloriac.ttf", "Meloriac", "normal");

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();

  paintPageBackground();

  const M = 40;
  const HEADER_H = 54;
  const GAP = 10;

  const cardW = PAGE_W - M * 2;
  const CARD_PAD_X = 14;
  const CARD_PAD_Y = 12;

  // logo arriba derecha
  let logoDataUrl = "";
  try {
    logoDataUrl = await fetchImageAsDataURL("/logoh.png");
  } catch {
    logoDataUrl = "";
  }

  const daySections: { title: string; rows: PdfRow[] }[] = [
    { title: "DÍA 1 — 14 DE FEBRERO", rows: buildRowsForDay(1) },
    { title: "DÍA 2 — 15 DE FEBRERO", rows: buildRowsForDay(2) }, // 👈 es 15 (tu data day2)
  ];

  let y = M;

function drawHeader() {
  // título
  doc.setFont("Meloriac", "normal");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("ITINERARIO COSQUÍN", M, y + 22);

  // logo
  if (logoDataUrl) {
    const logoW = 120;
    const logoH = 24;
    doc.addImage(logoDataUrl, "PNG", PAGE_W - M - logoW, y, logoW, logoH);
  }

  y += HEADER_H;

  // línea sutil blanca
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.setGState?.(new (doc as any).GState({ opacity: 0.25 }));
  doc.line(M, y, PAGE_W - M, y);
  doc.setGState?.(new (doc as any).GState({ opacity: 1 }));

  y += 14;
}

function drawDayTitle(text: string) {
  ensureSpace(52);

  doc.setFont("Meloriac", "normal");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(text, M, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  // subtítulo con opacidad (si tu jsPDF soporta GState)
  doc.setGState?.(new (doc as any).GState({ opacity: 0.75 }));
  doc.setGState?.(new (doc as any).GState({ opacity: 1 }));

  y += 40;
}

function newPage() {
    doc.addPage();
    paintPageBackground();
    y = M;
    drawHeader();
  }

  function ensureSpace(needed: number) {
    if (y + needed > PAGE_H - M) newPage();
  }

function getStageAccent(stage: string) {
  // color acento del borde (por stage)
  const base = stage ? (STAGE_PDF[stage]?.border ?? "#DD5227") : "#FFFFFF";
  return hexToRgb(base);
}

function drawRowCard(row: PdfRow) {
  const GAP = 10;

  const accent = getStageAccent(row.stage);

  // Card UI (oscuro translúcido)
  const cardH = 62;
  ensureSpace(cardH + GAP);

  // mismo azul del fondo pero más oscuro (card)
const cardBg = hexToRgb("#193E85");
doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);

  // borde general blanco 15%
  const border = withAlphaOnWhite({ r: 255, g: 255, b: 255 }, 0.18);
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(1);
  doc.roundedRect(M, y, cardW, cardH, 14, 14, "FD");

  // borde acento (izq) del color del escenario
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(3);
  doc.line(M + 8, y + 10, M + 8, y + cardH - 10);

  // Layout
  const leftX = M + 22;
  const rightX = M + cardW - 16;

  // ARTISTA (izq, grande)
  doc.setFont("Meloriac", "normal");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);

  const artistMaxW = cardW - 22 - 90; // deja espacio para la hora a la derecha
  const artistText = row.artist.toUpperCase();
  const artistLines = doc.splitTextToSize(artistText, artistMaxW);

  // si se va a 2 líneas, bajamos un toque
  let artistY = y + 26;
  if (artistLines.length > 1) artistY = y + 20;

  doc.text(artistLines.slice(0, 2), leftX, artistY);

  // ESCENARIO (abajo, izq)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  // “opacidad” simulada: gris clarito
  doc.setTextColor(230, 235, 245);

  const stageText = row.stage ? row.stage : "Libre / descanso";
  doc.text(stageText, leftX, y + cardH - 16);

  // HORA (derecha, “circular” look)
  // pill / badge
  const pillW = 74;
  const pillH = 30;
  const pillX = rightX - pillW;
  const pillY = y + (cardH - pillH) / 2;

  // fondo pill = color del escenario
doc.setFillColor(accent.r, accent.g, accent.b);

// borde pill un poco más oscuro (simula contraste)
const pillBorder = withAlphaOnWhite(accent, 0.85);
doc.setDrawColor(pillBorder.r, pillBorder.g, pillBorder.b);
doc.setLineWidth(1);
doc.roundedRect(pillX, pillY, pillW, pillH, 16, 16, "FD");

  // texto hora (bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(row.time, pillX + pillW / 2, pillY + 20, { align: "center" });

  y += cardH + GAP;
}

  // START
  drawHeader();

  for (const sec of daySections) {
    drawDayTitle(sec.title);

    if (sec.rows.length === 0) {
      ensureSpace(40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(110);
      doc.text("No hay selecciones para este día.", M, y + 10);
      y += 28;
      continue;
    }

    for (const r of sec.rows) drawRowCard(r);
  }

  doc.save("itinerario-cosquin.pdf");
}

  return (
    <div
      className="relative min-h-dvh overflow-hidden text-white"
      style={{
        backgroundImage: "url('/bg/cr-background.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "top center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/45" />

      <div className="relative min-h-dvh">
        <header className="sticky top-0 z-40 mb-6 w-full">
          <div className="border-b border-white/10 bg-black/45 backdrop-blur">
            <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-center px-4">
              <img
                src="/logoh.png"
                alt="Cosquín Rock"
                className="h-7 w-auto md:h-8"
              />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-5 py-6">
          <div className="rounded-[32px] border border-white/10 bg-transparent p-4 backdrop-blur-md md:p-6">
            <div className="border-b border-white/10 pb-4">
              <div className="mx-auto flex max-w-6xl items-center justify-center">
                <img
                  src="/titulo.png"
                  alt="Arma tu grilla"
                  className="h-[94px] w-auto md:h-[150px]"
                />
              </div>
            </div>

            <div className="mb-4 mt-6 flex justify-center gap-4 md:gap-6">
              <button
                onClick={() => setDay(1)}
                className={[
                  "rounded-full px-10 py-4",
                  "text-[20px] md:text-[26px] uppercase tracking-widest transition",
                  day === 1
                    ? "bg-[#DD5227] text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20",
                ].join(" ")}
                style={{ fontFamily: "var(--font-meloriac)" }}
              >
                DÍA 1
              </button>

              <button
                onClick={() => setDay(2)}
                className={[
                  "rounded-full px-10 py-4",
                  "text-[20px] md:text-[26px] uppercase tracking-widest transition",
                  day === 2
                    ? "bg-[#0e7a4c] text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20",
                ].join(" ")}
                style={{ fontFamily: "var(--font-meloriac)" }}
              >
                DÍA 2
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {slots.map((slot, index) => {
                const picked = selectedSummaryForSlot(slot);

                return (
                  <button
                    key={slot.time}
                    onClick={() => setOpenTime(slot.time)}
                    className={slotCardClass(index)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="text-[20px] leading-none tracking-wider md:text-[22px]"
                        style={{ fontFamily: "var(--font-circular)" }}
                      >
                        {/* ✅ ahora sí: 19:00 - 20:00 */}
                        {hourRangeLabel(slot.time)}
                      </div>

                      <div className="flex flex-wrap justify-end gap-1">
                        {picked.length === 0 ? (
                          <span className="text-xs tracking-wide text-white/70">
                            Elegí una opción
                          </span>
                        ) : (
                          <>
                            {picked.slice().map((p, idx) => {
                              const chip =
                                "rounded-full px-4 py-1 tracking-wider border border-white/10 " +
                                (p.stage
                                  ? stageTheme(p.stage).chip
                                  : "bg-white/10 text-white");

                              return (
                                <span
                                  key={idx}
                                  className={chip}
                                  style={{
                                    fontFamily: "var(--font-meloriac)",
                                    fontSize: "12px",
                                  }}
                                >
                                  {p.label}
                                </span>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] tracking-wide text-white/60">
                      {slot.shows.length + 1} opciones
                    </div>
                  </button>
                );
              })}
            </div>
            {/* LIMPIAR DÍA */}
            <div className="mt-4 flex align-right justify-end">
              <button
                onClick={clearDay}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs tracking-widest text-white hover:bg-white/20 transition"
                style={{ fontFamily: "var(--font-circular)" }}
              >
                LIMPIAR DÍA
              </button>
            </div>

            {/* INSTAGRAM INPUT */}
<div className="mt-6">
  <label
    className="mb-2 block text-xs tracking-widest uppercase text-white/70"
    style={{ fontFamily: "var(--font-circular)" }}
  >
    Dejá tu Instagram{" "}
    <span className="text-red-500">*</span>
  </label>

  <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
    <span
      className="text-white/80"
      style={{ fontFamily: "var(--font-circular)" }}
    >
      @
    </span>

    <input
      value={instagram}
      onChange={(e) => setInstagram(sanitizeInstagram(e.target.value))}
      placeholder="tu.instagram_123"
      className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
      style={{ fontFamily: "var(--font-circular)" }}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      inputMode="text"
      required
    />
  </div>

  {!isInstagramValid && (
    <div
      className="mt-2 text-xs text-red-400 tracking-wide"
      style={{ fontFamily: "var(--font-circular)" }}
    >
      Obligatorio. Mínimo 4 caracteres.
    </div>
  )}
</div>

            {/* SHARE BUTTONS */}
            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 md:flex-row md:justify-center md:gap-6">
              <button
                onClick={shareDay1}
                disabled={shareDisabled}
                className={[
                  "px-6 md:px-10 py-3 text-[14px] md:text-[16px] uppercase tracking-widest transition",
                  shareDisabled
                    ? "opacity-40 cursor-not-allowed bg-white/10 text-white/70"
                    : day === 1
                    ? "bg-[#DD5227] text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20",
                ].join(" ")}
                style={{ fontFamily: "var(--font-circular)" }}
              >
                COMPARTIR DÍA 1
              </button>

              <button
                onClick={shareDay2}
                disabled={shareDisabled}
                className={[
                  "px-6 md:px-10 py-3 text-[14px] md:text-[16px] uppercase tracking-widest transition",
                  shareDisabled
                    ? "opacity-40 cursor-not-allowed bg-white/10 text-white/70"
                    : day === 2
                    ? "bg-[#0e7a4c] text-white"
                    : "bg-white/10 text-white/80 hover:bg-white/20",
                ].join(" ")}
                style={{ fontFamily: "var(--font-circular)" }}
              >
                COMPARTIR DÍA 2
              </button>

              <button
                onClick={shareAll}
                disabled={shareDisabled}
                className={[
                  "px-6 md:px-10 py-3 text-[14px] md:text-[16px] uppercase tracking-widest transition",
                  shareDisabled
                    ? "opacity-40 cursor-not-allowed bg-white/10 text-white/70"
                    : "bg-[#A571CF] text-white",
                ].join(" ")}
                style={{ fontFamily: "var(--font-circular)" }}
              >
                COMPARTIR MI GRILLA
              </button>
            </div>

            {/* PDF */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={downloadPDFItinerary}
                className={[
                  "px-6 md:px-10",
                  "py-3",
                  "text-[14px] md:text-[16px]",
                  "uppercase tracking-widest",
                  "transition",
                  "bg-white text-black hover:opacity-90",
                ].join(" ")}
                style={{ fontFamily: "var(--font-circular)" }}
              >
                DESCARGAR PDF
              </button>
            </div>

          </div>

          {/* POSTERS OCULTOS */}
          <div className="fixed -left-0 top-0 opacity-0 pointer-events-none"
          style={{transform: "translateY(-2000px" }}>
            <div ref={posterRefDay1}>
              <ExportPoster
                variant="day1"
                selectedShows={selectedShowsDay1}
                instagram={instagram}
              />
            </div>

            <div ref={posterRefDay2}>
              <ExportPoster
                variant="day2"
                selectedShows={selectedShowsDay2}
                instagram={instagram}
              />
            </div>

            <div ref={posterRefAll}>
              <ExportPoster
                variant="all"
                selectedShows={selectedShowsAll}
                instagram={instagram}
              />
            </div>
          </div>
        </main>

        {/* MODAL */}
        {openSlot && (
          <div className="fixed inset-0 z-50">
            <button
              aria-label="Close"
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setOpenTime(null)}
            />

            <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
              <div
                className="relative w-full max-w-4xl rounded-3xl border border-black shadow-2xl"
                style={{
                  backgroundImage: "url('/bg/cr-background.png')",
                  backgroundRepeat: "repeat",
                  backgroundSize: "960px 960px",
                }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-black/55" />

                <div className="relative rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-5 py-4 backdrop-blur-md">
                    <div>
                      <div
                        className="text-xs text-white/70 tracking-wider"
                        style={{ fontFamily: "var(--font-circular)" }}
                      >
                        Elegir para
                      </div>

                      <div
                        className="text-[34px] leading-none tracking-widest text-white md:text-[44px]"
                        style={{ fontFamily: "var(--font-circular)" }}
                      >
                        {openSlot.time} – {addOneHour(openSlot.time)}
                      </div>
                    </div>

                    <button
                      onClick={() => setOpenTime(null)}
                      className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs tracking-wider text-white hover:bg-white/20 transition"
                      style={{ fontFamily: "var(--font-circular)" }}
                    >
                      CERRAR
                    </button>
                  </div>

                  <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span
                              className="text-[16px] tracking-wide text-white"
                              style={{ fontFamily: "var(--font-circular)" }}
                            >
                              Libre
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
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#DD5227] text-white opacity-0 peer-checked:opacity-100">
                            ✓
                          </div>
                        </div>
                      </label>

                      {openSlot.shows.map((s) => {
                        const key = showKey(s);
                        const checked = (selection[openSlot.time] ?? []).includes(key);
                        const th = stageTheme(s.stage);

                        return (
                          <label
                            key={key}
                            className={[
                              "flex cursor-pointer items-center justify-between rounded-2xl border border-white/15 p-4 transition hover:brightness-[1.03]",
                              th.cardBg,
                            ].join(" ")}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3">
                                <span className={stageBadgeClass(s.stage)}>{s.stage}</span>

                                <span
                                  className={["text-[16px] tracking-wide", th.text].join(" ")}
                                  style={{ fontFamily: "var(--font-circular)" }}
                                >
                                  {s.artist}
                                </span>
                              </div>

                              <div
                                className={["text-xs tracking-wide opacity-90", th.text].join(" ")}
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
                              <div
                                className={[
                                  "h-7 w-7 rounded-md border border-white/20 bg-white/10",
                                  th.checkOn,
                                ].join(" ")}
                              />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#DD5227] text-white opacity-0 peer-checked:opacity-100">
                                ✓
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-4 pb-2 text-xs tracking-wide text-white/60">
                      Multi-select activo.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 mb-6 text-center text-sm tracking-wide text-white/70">
          © 2026 Cosquín Rock. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}

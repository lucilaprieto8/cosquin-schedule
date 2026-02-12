import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Body = {
  ig?: string;
  action: "share_day1" | "share_day2" | "pdf";
  day1?: string[];
  day2?: string[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const ig = (body.ig ?? "").replace(/^@/, "").trim() || null;
  const day1 = body.day1 ?? [];
  const day2 = body.day2 ?? [];

  // 1) guardar snapshot de export
  const { error: e1 } = await supabase.from("grilla_exports").insert({
    ig,
    action: body.action,
    day1,
    day2,
    user_agent: req.headers.get("user-agent"),
    referrer: req.headers.get("referer"),
  });

  if (e1) return NextResponse.json({ ok: false, error: e1.message }, { status: 500 });

  // 2) (opcional pero útil) desnormalizado para conteos por artista
  const picks: { ig: string | null; day: number; artist: string }[] = [];
  for (const a of day1) picks.push({ ig, day: 1, artist: a });
  for (const a of day2) picks.push({ ig, day: 2, artist: a });

  if (picks.length) {
    const { error: e2 } = await supabase.from("artist_picks").insert(picks);
    if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
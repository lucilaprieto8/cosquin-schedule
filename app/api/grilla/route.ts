import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const instagram = (body.instagram ?? "")
      .replace(/@/g, "")
      .trim()
      .toLowerCase();

    if (!instagram) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    await sql`
      INSERT INTO grillas (instagram, day1, day2, user_agent)
      VALUES (
        ${instagram},
        ${JSON.stringify(body.day1)}::jsonb,
        ${JSON.stringify(body.day2)}::jsonb,
        ${req.headers.get("user-agent") ?? ""}
      )
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
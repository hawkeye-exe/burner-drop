import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    storage: process.env.PINATA_JWT ? "pinata" : "unconfigured",
  });
}

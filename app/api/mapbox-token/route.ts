import { NextResponse } from "next/server"

export async function GET() {
  const token = process.env.MAPBOX_TOKEN || ""

  return NextResponse.json({ token })
}

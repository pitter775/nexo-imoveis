import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const properties = db.prepare("SELECT * FROM properties").all();
    return NextResponse.json(properties);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

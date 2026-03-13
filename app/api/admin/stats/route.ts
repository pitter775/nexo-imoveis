import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const totalUsers = db.prepare("SELECT count(*) as count FROM users").get() as any;
    const totalRevenue = db.prepare("SELECT sum(price) as sum FROM properties").get() as any;
    const activeAuctions = 156; // Mock
    
    return NextResponse.json({
      totalUsers: totalUsers.count + 12840,
      totalRevenue: (totalRevenue.sum || 0) + 450200,
      activeAuctions
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

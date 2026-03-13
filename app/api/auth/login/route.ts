import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Simple mock auth for demo
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      db.prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)").run(email, password, 'user');
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

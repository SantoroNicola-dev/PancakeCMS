import { NextResponse } from "next/server";
import { PENDING_2FA_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  res.cookies.delete(PENDING_2FA_COOKIE_NAME);
  return res;
}


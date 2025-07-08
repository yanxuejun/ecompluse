import { auth } from "@clerk/nextjs/server";
import { getUserProfile, createUserProfile } from "@/lib/bigquery";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = auth();
  console.log("[user/init] userId:", userId);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await getUserProfile(userId);
  console.log("[user/init] profile:", profile);
  if (!profile) {
    try {
      await createUserProfile(userId); // credits=20, tier='starter'
      console.log("[user/init] createUserProfile success for:", userId);
      return NextResponse.json({ created: true });
    } catch (e) {
      console.error("[user/init] createUserProfile error:", e);
      return NextResponse.json({ error: "Failed to create UserProfile", detail: String(e) }, { status: 500 });
    }
  }
  return NextResponse.json({ exists: true });
} 
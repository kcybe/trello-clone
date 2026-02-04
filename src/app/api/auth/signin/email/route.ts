import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: req.headers,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }
}

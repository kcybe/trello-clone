import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// Export the GET and POST handlers from auth
export const GET = auth.handler;
export const POST = auth.handler;

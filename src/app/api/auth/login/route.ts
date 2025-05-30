import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:3000",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Ensure we can read the body properly
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be application/json" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "http://localhost:3000", "Access-Control-Allow-Credentials": "true" } }
      );
    }

    const body = await request.json();
    const { doctorId, password, role } = body;
    
    console.log("Login attempt:", { doctorId, role });
    
    let user;
    
    if (role === "DOCTOR") {
      // Find doctor by doctorId
      user = await prisma.user.findFirst({
        where: { doctorId }
      });
    } else {
      // Find admin by email
      user = await prisma.user.findFirst({
        where: { 
          email: body.email,
          role
        }
      });
    }
    
    if (!user) {
      console.log("User not found");
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401, headers: { "Access-Control-Allow-Origin": "http://localhost:3000", "Access-Control-Allow-Credentials": "true" } });
    }
    
    // Check password
    if (user.password !== password) {
      console.log("Invalid password");
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401, headers: { "Access-Control-Allow-Origin": "http://localhost:3000", "Access-Control-Allow-Credentials": "true" } });
    }
    
    // Set session cookies
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/"
    });
    
    cookieStore.set("userRole", user.role, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/"
    });
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    }, { headers: { "Access-Control-Allow-Origin": "http://localhost:3000", "Access-Control-Allow-Credentials": "true" } });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "An error occurred during login" }, { status: 500, headers: { "Access-Control-Allow-Origin": "http://localhost:3000", "Access-Control-Allow-Credentials": "true" } });
  }
} 
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export const proxy = auth((request) => {
  if (!request.auth?.user) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("reason", "session");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/executive/:path*",
    "/admin/:path*",
    "/operator/:path*",
    "/settings/:path*",
    "/academic-years/:path*",
    "/classes/:path*",
    "/teachers/:path*",
    "/students/:path*",
    "/attendance/:path*",
    "/finance/:path*",
    "/facilities/:path*",
    "/maintenance/:path*",
    "/users/:path*",
    "/activity-logs/:path*",
    "/forbidden",
  ],
};

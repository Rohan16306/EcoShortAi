import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control
    if (path.startsWith("/admin-portal") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/sign-up-login-screen", req.url));
    }

    if (path.startsWith("/collector-dashboard") && token?.role !== "collector" && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/sign-up-login-screen", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Protect all these routes (sub-routes included)
export const config = {
  matcher: [
    "/admin-portal/:path*",
    "/collector-dashboard/:path*",
    "/pickup-request-tracking/:path*",
    "/rewards/:path*"
  ]
};

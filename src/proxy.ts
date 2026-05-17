import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const publicPaths = ["/login", "/signup", "/auth/callback"];

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    if (!user && !publicPaths.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && publicPaths.some((p) => pathname.startsWith(p))) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

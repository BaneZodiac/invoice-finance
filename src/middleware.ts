import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const publicPaths = ["/login", "/signup", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  if (publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return supabaseResponse;
  }

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};

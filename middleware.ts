import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/", "/privacy", "/terms", "/auth/login", "/auth/signup", "/auth/check-email", "/auth/forgot-password", "/auth/reset-password", "/auth/callback", "/auth/confirm"];
const roleRoots = ["personal", "student", "teacher", "admin"] as const;

function isPublic(pathname: string) {
  return publicPaths.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  if (!user && !isPublic(pathname)) {
    if (isApi) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (user) {
    const root = pathname.split("/")[1];
    if (roleRoots.includes(root as (typeof roleRoots)[number])) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role && profile.role !== root) {
        const destination = request.nextUrl.clone();
        destination.pathname = `/${profile.role}`;
        destination.search = "";
        return NextResponse.redirect(destination);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

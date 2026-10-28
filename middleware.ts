import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Protected routes that require authentication
const protectedRoutes = ["/chat", "/map"]

// Routes that require specific roles
const roleRoutes: Record<string, string[]> = {
  "/admin": ["admin"],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create a response object to mutate
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: any) {
        response.cookies.set({
          name,
          value: "",
          ...options,
        })
      },
    },
  })

  // Check if route is protected
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtected) {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Redirect to login if no session
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    // Check role-based access
    const requiredRoles = Object.entries(roleRoutes).find(([route]) => pathname.startsWith(route))?.[1]

    if (requiredRoles) {
      // Get authenticated user to check role
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }

      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !requiredRoles.includes(profile.role)) {
        // Redirect to unauthorized page or dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}

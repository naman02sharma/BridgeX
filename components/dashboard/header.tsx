"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Building2, Flame, Heart, LogOut, CheckCircle2, Siren, Radio } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RealTimeNotifications } from "@/components/real-time-notifications"
import { useSupabase } from "@/components/supabase-provider"
import { signOut } from "@/lib/auth"
import { useRouter } from "next/navigation"

export function DashboardHeader() {
  const { user } = useSupabase()
  const router = useRouter()

  const orgName = user?.organization || user?.name || "Emergency Responder Command"
  const rawRole = (user?.role || (user as any)?.user_metadata?.responderRole || "").toLowerCase()
  const rawSpec = ((user as any)?.specialization || "").toLowerCase()
  const orgLower = (user?.organization || "").toLowerCase()

  const isHospital = rawRole === "hospital" || rawSpec === "hospital" || rawRole === "medical" || rawSpec === "medical" || orgLower.includes("hospital") || orgLower.includes("medical") || orgLower.includes("clinic")
  const isFire = rawRole === "fire" || rawSpec === "fire" || orgLower.includes("fire") || orgLower.includes("rescue")
  const isPolice = rawRole === "police" || rawSpec === "police" || rawRole === "security" || rawSpec === "security" || orgLower.includes("police") || orgLower.includes("security")

  const deptMeta = isFire
    ? {
        label: "Fire & Rescue Department",
        badge: "Fire Emergency Operations (101)",
        icon: Flame,
        color: "text-orange-500",
        badgeBg: "bg-orange-500/10 text-orange-500 border-orange-500/30",
        avatarBg: "bg-orange-600 text-white",
        avatarText: "FD",
      }
    : isHospital
    ? {
        label: "Hospital & Medical Response",
        badge: "Medical Emergency Operations (102 / 108)",
        icon: Heart,
        color: "text-red-500",
        badgeBg: "bg-red-500/10 text-red-500 border-red-500/30",
        avatarBg: "bg-red-600 text-white",
        avatarText: "MED",
      }
    : isPolice
    ? {
        label: "Police & Security Command",
        badge: "Law Enforcement Operations (112)",
        icon: Shield,
        color: "text-blue-500",
        badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/30",
        avatarBg: "bg-blue-600 text-white",
        avatarText: "POL",
      }
    : {
        label: "Emergency Responder Command",
        badge: "Emergency Operations Grid (112)",
        icon: Radio,
        color: "text-emerald-500",
        badgeBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
        avatarBg: "bg-primary text-primary-foreground",
        avatarText: "ER",
      }

  const DeptIcon = deptMeta.icon

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (e) {
      console.error("Logout error:", e)
    }
  }

  return (
    <header className="border-b bg-card/80 backdrop-blur-md sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Organization & Department Info */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${deptMeta.avatarBg} shadow-md flex items-center justify-center`}>
              <DeptIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-foreground capitalize">
                  {orgName}
                </h1>
                <Badge variant="outline" className={`text-[11px] font-semibold ${deptMeta.badgeBg}`}>
                  {deptMeta.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Responder Agency
                </span>
                <span>•</span>
                <span>{user?.email}</span>
                {user?.phone && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{user.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Operational Status & Controls */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <Badge variant="secondary" className="px-3 py-1 text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              On-Duty Dispatch
            </Badge>

            {/* Real-time Push & In-App Notifications connected to real user ID */}
            {user?.id && <RealTimeNotifications userId={user.id} />}

            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive"
              title="Sign Out of Operations Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

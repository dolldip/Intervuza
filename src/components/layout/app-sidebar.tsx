"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Video, 
  History, 
  Settings, 
  BrainCircuit, 
  UserCircle,
  Trophy,
  CreditCard,
  LogOut,
  Loader2,
  ShieldAlert
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc } from "firebase/firestore"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Mock Interviews",
    url: "/interviews/new",
    icon: Video,
  },
  {
    title: "AI Coach",
    url: "/dashboard",
    icon: BrainCircuit,
  },
  {
    title: "History",
    url: "/dashboard",
    icon: History,
  },
  {
    title: "Achievements",
    url: "/dashboard",
    icon: Trophy,
  },
]

const accountItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: UserCircle,
  },
  {
    title: "Subscription",
    url: "/subscription",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/dashboard",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const auth = useAuth()

  // Use the roles_admin check defined in our security logic
  const adminDocRef = useMemoFirebase(() => user ? doc(db!, "roles_admin", user.uid) : null, [db, user])
  const { data: adminDoc } = useDoc(adminDocRef)

  const isAdmin = React.useMemo(() => {
    return user?.email === "dollyjajra123@gmail.com" || !!adminDoc
  }, [user, adminDoc])

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center space-x-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <BrainCircuit className="text-white w-5 h-5" />
          </div>
          <span className="font-headline font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden">Intervuza</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administrator</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith("/admin")} tooltip="Admin Portal">
                    <Link href="/admin">
                      <ShieldAlert className="text-red-500" />
                      <span className="font-bold text-red-500">Admin Console</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {isUserLoading ? (
              <div className="flex items-center justify-center h-12 w-full">
                <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 h-12 w-full px-2">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={`https://picsum.photos/seed/${user.uid}/40/40`} />
                  <AvatarFallback className="rounded-lg">{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden flex-1">
                  <span className="text-sm font-bold truncate w-full">{user.displayName || "Candidate"}</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full">{user.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-muted rounded-lg transition-colors group-data-[collapsible=icon]:hidden"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <SidebarMenuButton asChild>
                <Link href="/login">
                  <LogOut />
                  <span>Login</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}


"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-16 items-center gap-4 border-b bg-background/50 backdrop-blur-sm px-6 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Intervuza | Performance Portal</h2>
          </div>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

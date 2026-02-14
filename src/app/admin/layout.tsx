"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Loader2, ShieldAlert } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const router = useRouter()
  const [isAuthorizing, setIsAuthorizing] = useState(true)

  // Use the roles_admin check defined in our security logic
  const adminDocRef = useMemoFirebase(() => user ? doc(db!, "roles_admin", user.uid) : null, [db, user])
  const { data: adminDoc, isLoading: adminLoading } = useDoc(adminDocRef)

  useEffect(() => {
    if (isUserLoading || adminLoading) return

    const isGlobalAdmin = user?.email === "dollyjajra123@gmail.com"
    const hasAdminRole = !!adminDoc
    const isEmailVerified = user?.emailVerified

    if (!user) {
      router.push("/login")
    } else if (!isEmailVerified) {
      // In a real app, you might show a "verify email" prompt instead of blocking
      router.push("/dashboard")
    } else if (!isGlobalAdmin && !hasAdminRole) {
      router.push("/not-authorized")
    } else {
      setIsAuthorizing(false)
    }
  }, [user, isUserLoading, adminDoc, adminLoading, router])

  if (isUserLoading || adminLoading || isAuthorizing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-headline font-bold uppercase tracking-widest text-muted-foreground">Authenticating Admin...</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-muted/20 min-h-screen">
      {children}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Loader2 } from "lucide-react"

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

    if (!user) {
      router.push("/login")
    } else if (!isGlobalAdmin && !hasAdminRole) {
      // Unauthorized users go to security page
      router.push("/not-authorized")
    } else {
      setIsAuthorizing(false)
    }
  }, [user, isUserLoading, adminDoc, adminLoading, router])

  if (isUserLoading || adminLoading || isAuthorizing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
        <h2 className="text-sm font-headline font-black uppercase tracking-[0.3em] text-primary">Security Clearance Active</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-black">
      {children}
    </div>
  )
}

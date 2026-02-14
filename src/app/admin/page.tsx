
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  ArrowUpRight,
  UserPlus,
  Search,
  LayoutDashboard
} from "lucide-react"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"

export default function AdminDashboard() {
  const db = useFirestore()

  const usersQuery = useMemoFirebase(() => collection(db!, "users"), [db])
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery)

  const paymentsQuery = useMemoFirebase(() => collection(db!, "payments"), [db])
  const { data: payments, isLoading: paymentsLoading } = useCollection(paymentsQuery)

  const stats = useMemo(() => {
    const totalUsers = users?.length || 0
    const paidUsers = users?.filter(u => u.subscription === "pro" || u.subscription === "premium").length || 0
    const totalRevenue = payments?.filter(p => p.status === "succeeded")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

    return {
      totalUsers,
      paidUsers,
      totalRevenue
    }
  }, [users, payments])

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-headline font-bold flex items-center gap-3">
            <LayoutDashboard className="w-10 h-10 text-primary" />
            Admin Console
          </h1>
          <p className="text-muted-foreground text-lg">System-wide performance and user oversight.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" asChild className="rounded-xl h-12 font-bold">
            <Link href="/admin/users">
              <Users className="mr-2 w-4 h-4" />
              Manage Users
            </Link>
          </Button>
          <Button asChild className="rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
            <Link href="/admin/payments">
              <CreditCard className="mr-2 w-4 h-4" />
              Payment Records
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Paid Members", value: stats.paidUsers, icon: UserPlus, color: "text-green-600", bg: "bg-green-100" },
          { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
            <CardContent className="p-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-4xl font-black">{stat.value}</h3>
              </div>
              <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-8 h-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">Recent Users</CardTitle>
              <CardDescription>Latest enrollments in the PrepWise network.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="font-bold text-primary">
              <Link href="/admin/users">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              {usersLoading ? (
                <div className="p-12 text-center text-muted-foreground">Syncing...</div>
              ) : users?.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-6 border-b last:border-none hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">
                      {user.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-bold">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="rounded-lg px-3">
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">Recent Revenue</CardTitle>
              <CardDescription>Activity from the simulated billing portal.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="font-bold text-primary">
              <Link href="/admin/payments">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              {paymentsLoading ? (
                <div className="p-12 text-center text-muted-foreground">Syncing...</div>
              ) : payments?.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-6 border-b last:border-none hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Payment {payment.paymentId?.substring(0, 8)}...</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(payment.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">${payment.amount}</p>
                    <p className="text-[9px] font-bold text-green-600 uppercase">Succeeded</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

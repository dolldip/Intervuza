"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  CreditCard, 
  Download, 
  Filter,
  ArrowLeft,
  Calendar,
  DollarSign
} from "lucide-react"
import Link from "next/link"

export default function PaymentManagement() {
  const db = useFirestore()
  
  const paymentsQuery = useMemoFirebase(() => collection(db!, "payments"), [db])
  const { data: payments, isLoading } = useCollection(paymentsQuery)

  const stats = useMemo(() => {
    if (!payments) return { total: 0, count: 0 }
    const valid = payments.filter(p => p.status === "succeeded")
    return {
      total: valid.reduce((acc, curr) => acc + (curr.amount || 0), 0),
      count: valid.length
    }
  }, [payments])

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="rounded-xl px-2">
            <Link href="/admin"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold">Revenue Audit</h1>
            <p className="text-muted-foreground">Comprehensive log of simulated high-stakes billing.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl font-bold h-11">
            <Filter className="mr-2 w-4 h-4" /> Filter
          </Button>
          <Button className="rounded-xl font-bold shadow-lg h-11">
            <Download className="mr-2 w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-none shadow-sm bg-primary text-white p-8 overflow-hidden relative">
          <DollarSign className="w-24 h-24 absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Aggregate Revenue</p>
          <h2 className="text-5xl font-black">${stats.total.toLocaleString()}</h2>
          <p className="text-xs mt-4 opacity-70">Total processed through AI simulated gateway.</p>
        </Card>
        <Card className="rounded-[2rem] border-none shadow-sm bg-white p-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Total Transactions</p>
            <h2 className="text-5xl font-black">{stats.count}</h2>
            <p className="text-xs mt-4 text-muted-foreground">Successful performance audits funded.</p>
          </div>
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center">
            <CreditCard className="w-10 h-10" />
          </div>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14 pl-8">Payment ID</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">User UID</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Amount</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Status</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14 pr-8">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">Neural synchronization active...</TableCell>
                </TableRow>
              ) : payments && payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/5 group transition-colors border-muted/10">
                    <TableCell className="pl-8 py-6">
                      <p className="font-mono text-xs font-bold">{payment.paymentId || 'N/A'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">{payment.userId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-primary">${payment.amount}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-lg px-3 border-green-200 bg-green-50 text-green-700 font-bold">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-8 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground font-medium">No payment history found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
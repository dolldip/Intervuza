"use client"

import { useState, useMemo } from "react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  Search, 
  MoreVertical, 
  ShieldCheck, 
  UserX, 
  Trash2, 
  UserCog,
  ArrowLeft,
  ShieldAlert
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function UserManagement() {
  const db = useFirestore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

  const usersQuery = useMemoFirebase(() => collection(db!, "users"), [db])
  const { data: users, isLoading } = useCollection(usersQuery)

  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'candidate' : 'admin'
    try {
      await updateDoc(doc(db!, "users", userId), { role: newRole })
      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}.`
      })
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Security constraints active." })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user data?")) return
    try {
      await deleteDoc(doc(db!, "users", userId))
      toast({ title: "User Deleted", description: "Account data purged from Firestore." })
    } catch (err) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Security constraints active." })
    }
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="rounded-xl px-2">
            <Link href="/admin"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold">User Management</h1>
            <p className="text-muted-foreground">Admin-only portal for credential oversight.</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email or name..." 
            className="pl-10 h-11 rounded-xl shadow-sm border-none bg-white" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14 pl-8">User</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Role</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Status</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14">Joined</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] h-14 w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">Neural synchronization active...</TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/5 group transition-colors border-muted/10">
                    <TableCell className="pl-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {user.fullName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="rounded-lg px-3 py-1 font-bold">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.dataDeletionRequested ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-xs font-medium">{user.dataDeletionRequested ? 'Flagged' : 'Active'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-48 p-2">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.role)} className="rounded-lg gap-2 cursor-pointer font-bold">
                            <UserCog className="w-4 h-4" /> Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-bold">
                            <UserX className="w-4 h-4" /> Block User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="rounded-lg gap-2 cursor-pointer font-bold text-red-600 focus:text-red-600">
                            <Trash2 className="w-4 h-4" /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                      <ShieldAlert className="w-12 h-12 opacity-20" />
                      <p className="font-medium">No users found matching your query.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
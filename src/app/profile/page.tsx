
"use client"

import { useState, useEffect } from "react"
import { useAuth, useFirestore, useDoc } from "@/firebase"
import { doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, UserCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user } = useAuth()
  const db = useFirestore()
  const { toast } = useToast()
  
  const userDocRef = user ? doc(db!, "users", user.uid) : null
  const { data: profile, loading: profileLoading } = useDoc(userDocRef)

  const [fullName, setFullName] = useState("")
  const [education, setEducation] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "")
      setEducation(profile.education || "")
      setTargetRole(profile.targetRole || "")
      setExperienceLevel(profile.experienceLevel || "")
    } else {
      setFullName(sessionStorage.getItem('demo_name') || "")
      setEducation(sessionStorage.getItem('demo_edu') || "")
      setTargetRole(sessionStorage.getItem('demo_role') || "")
      setExperienceLevel(sessionStorage.getItem('demo_exp') || "")
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    
    sessionStorage.setItem('demo_name', fullName)
    sessionStorage.setItem('demo_edu', education)
    sessionStorage.setItem('demo_role', targetRole)
    sessionStorage.setItem('demo_exp', experienceLevel)

    if (!user || !db) {
      setTimeout(() => {
        toast({
          title: "Profile Updated",
          description: "Data saved to your local session.",
        })
        setSaving(false)
      }, 500)
      return
    }

    try {
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        fullName,
        education,
        targetRole,
        experienceLevel,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      toast({
        title: "Profile Saved",
        description: "Your information has been synced to your account.",
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Saved to local session only.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading && user) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-12 px-4 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <UserCircle className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-3xl font-headline font-bold">Your AI Profile</h1>
          <p className="text-muted-foreground">Tailor your questions based on your background and goals.</p>
        </div>
      </div>

      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Target Role & Education</CardTitle>
          <CardDescription>Sarah uses these details to generate technical and behavioral questions specific to top-tier companies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Rivera"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="education">Your Education</Label>
            <Textarea 
              id="education" 
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. Bachelor's in Computer Science from Stanford University"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetRole">The Job You Want</Label>
              <Input 
                id="targetRole" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger id="experienceLevel">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid-Level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                  <SelectItem value="lead">Lead / Executive (10+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-6">
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px] h-11 font-bold">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save AI Profile
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

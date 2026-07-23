import { useState } from "react"
import { useLocation } from "wouter"
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench } from "lucide-react"

export default function Login() {
  const [, setLocation] = useLocation()
  const { data: user, isLoading: isChecking } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } })
  const login = useLogin()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // If already logged in, redirect
  if (user) {
    setLocation("/")
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    login.mutate(
      { data: { username, password } },
      {
        onSuccess: () => setLocation("/"),
        onError: (err: any) => setError(err.message || "Invalid credentials. Try again.")
      }
    )
  }

  if (isChecking) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      
      <Card className="w-full max-w-sm border-primary/20 bg-card/80 backdrop-blur-xl relative z-10 shadow-2xl shadow-primary/5">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-widest text-primary">MOTOTRACK</CardTitle>
            <CardDescription className="font-mono text-xs uppercase mt-2">Systems Online. Authentication Required.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="uppercase text-xs tracking-wider text-muted-foreground">Operator ID</Label>
              <Input 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="font-mono text-lg h-12 bg-black/40 border-primary/20 focus-visible:border-primary focus-visible:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="uppercase text-xs tracking-wider text-muted-foreground">Access Code</Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono text-lg h-12 bg-black/40 border-primary/20 focus-visible:border-primary focus-visible:ring-primary"
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-mono rounded-sm text-center">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold tracking-wider" 
              disabled={login.isPending}
            >
              {login.isPending ? "VERIFYING..." : "ENGAGE"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

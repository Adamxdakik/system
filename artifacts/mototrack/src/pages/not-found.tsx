import { AlertCircle } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center font-mono">
      <AlertCircle className="h-16 w-16 text-destructive" />
      <div>
        <h1 className="text-4xl font-bold text-destructive tracking-widest">404</h1>
        <p className="text-muted-foreground uppercase mt-2">Sector Not Found</p>
      </div>
    </div>
  )
}

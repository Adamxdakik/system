import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isChunkError: boolean;
}

/** Detect "Failed to fetch dynamically imported module" — stale deployment chunks */
function isChunkLoadError(error: Error): boolean {
  const msg = error?.message ?? "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module") ||
    /Loading chunk \d+ failed/.test(msg)
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);

    // Stale deployment chunk — reload automatically once so the browser gets
    // the freshly deployed HTML + new chunk filenames.
    if (isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem("chunk-reload") === "1";
      if (!alreadyReloaded) {
        sessionStorage.setItem("chunk-reload", "1");
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    sessionStorage.removeItem("chunk-reload");
    this.setState({ hasError: false, error: undefined, isChunkError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.state.isChunkError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
            <div className="p-4 bg-muted rounded-full">
              <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Reloading…</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                A new version of the app was deployed. Refreshing to get the latest files.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Now
            </Button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.state.error?.message || "An unexpected error occurred on this page."}
            </p>
          </div>
          <Button onClick={this.handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

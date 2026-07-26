import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  errorMessage,
  isStaleChunkError,
  shouldReloadForStaleChunk,
  type StorageLike,
} from "@/lib/frontendResilience";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  recoveringFromStaleChunk: boolean;
}

function sessionStorageOrUndefined(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, recoveringFromStaleChunk: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, recoveringFromStaleChunk: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);

    if (shouldReloadForStaleChunk(error, sessionStorageOrUndefined())) {
      this.setState({ recoveringFromStaleChunk: true }, () => window.location.reload());
    }
  }

  componentDidUpdate(previousProps: Props) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined, recoveringFromStaleChunk: false });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, recoveringFromStaleChunk: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      if (this.state.recoveringFromStaleChunk) {
        return (
          <div
            className="flex min-h-[400px] flex-col items-center justify-center gap-3 p-8 text-center"
            role="status"
            aria-live="polite"
          >
            <RefreshCw className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
            <p className="font-medium">Refreshing the application…</p>
            <p className="text-sm text-muted-foreground">
              A newer deployed version is being loaded.
            </p>
          </div>
        );
      }

      const staleChunk = isStaleChunkError(this.state.error);
      const detail = errorMessage(this.state.error);

      return (
        <div
          className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">
              {staleChunk ? "A newer application version is available" : "Something went wrong"}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {staleChunk
                ? "Reload the application to use the latest deployed files."
                : import.meta.env.DEV && detail
                  ? detail
                  : "This page could not finish loading. You can retry the page or reload the application."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!staleChunk && (
              <Button type="button" onClick={this.handleReset} className="gap-2" autoFocus>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
            )}
            <Button
              type="button"
              variant={staleChunk ? "default" : "outline"}
              onClick={this.handleReload}
              className="gap-2"
              autoFocus={staleChunk}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

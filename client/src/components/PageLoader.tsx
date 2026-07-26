interface PageLoaderProps {
  fullScreen?: boolean;
  label?: string;
}

export function PageLoader({ fullScreen = false, label = "Loading page" }: PageLoaderProps) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[300px]"}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

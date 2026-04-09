export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-sm font-mono text-neutral-600">404</p>
        <h1 className="text-lg font-semibold text-neutral-100">Video not found</h1>
        <p className="text-sm text-neutral-500">
          This recording may have been removed or the link is invalid.
        </p>
      </div>
    </main>
  );
}

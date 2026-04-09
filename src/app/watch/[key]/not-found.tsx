export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Video not found</h1>
        <p className="text-sm text-neutral-400">
          This recording may have been removed or the link is invalid.
        </p>
      </div>
    </main>
  );
}

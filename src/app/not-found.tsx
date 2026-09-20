export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <a href="/" className="text-primary mt-4 inline-block hover:underline">
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

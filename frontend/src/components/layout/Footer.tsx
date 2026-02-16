export function Footer() {
  return (
    <footer className="container max-w-none mx-auto px-10 py-4">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} The Hive. Built for SWE 573 at the
        Bogazici University.
      </p>
    </footer>
  );
}

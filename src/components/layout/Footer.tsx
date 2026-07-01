export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 text-sm text-muted sm:flex-row sm:px-10">
        <span className="font-display text-base text-parchment-dim">Acre</span>
        <p>&copy; {year} Acre Financial. A concept demonstration, not a live product.</p>
        <div className="flex items-center gap-6">
          <a href="#top" className="transition-colors duration-200 hover:text-brass-bright">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}

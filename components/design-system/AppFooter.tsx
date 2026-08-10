import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>© 2026 ガクガクAIシステム</span>
      <nav aria-label="法的情報">
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/terms">利用規約</Link>
      </nav>
    </footer>
  );
}

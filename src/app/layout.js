
import "./globals.css";
import Link from "next/link";

const navigation = [["⌂", "Dashboard", "/dashboard"], ["◷", "Reminders", "/reminders"], ["◌", "Categories", "/categories"]];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="app-shell">
          <header className="app-header">
            <Link className="brand" href="/dashboard"><span className="brand-mark">L</span><span className="brand-name">LifeRadar</span></Link>
            <div className="header-actions"><button aria-label="Search" className="icon-button">⌕</button><button aria-label="Notifications" className="icon-button">♢</button><div className="profile-chip"><span className="profile-avatar">JM</span><span>Jordan Miller</span></div></div>
          </header>
          <div className="app-body">
            <aside className="sidebar"><p className="sidebar-label">Your life, in focus</p><nav className="nav-list" aria-label="Main navigation">{navigation.map(([icon, label, href]) => <Link className="nav-link" href={href} key={href}><span aria-hidden="true" className="nav-icon">{icon}</span>{label}</Link>)}</nav></aside>
            <section className="page-wrap">{children}</section>
          </div>
        </main>
    </body>
    </html>
  );
}



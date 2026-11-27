"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { History, Sun, Moon, X, Trash2 } from "lucide-react";
import { tools } from "@/tools/registry";
import { useToolkit } from "@/store/useToolkit";
import { fromSI, toSI, unitLabels } from "@/lib/units";

export default function ToolShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const s = useToolkit();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [more, setMore] = useState(false);
  const [target, setTarget] = useState("psychrometrics");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(media.matches);
    const change = (event: MediaQueryListEvent) => setDark(event.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  const handleTabKey = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = tools.findIndex(tool => tool.href === path);
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + tools.length) % tools.length;
    router.push(tools[next].href);
  };

  const groups = tools.map(tool => ({
    tool,
    items: s.history.filter(result => result.toolId === tool.id).sort((a, b) => b.timestamp - a.timestamp)
  })).filter(group => group.items.length > 0);

  return (
    <div className={dark ? "app dark" : "app"}>
      <header className="topbar">
        <Link href="/" className="brand">
          <b className="brand-mark">H</b>
          <span>HVAC <strong>Toolkit</strong><small>MEP engineering tools</small></span>
        </Link>
        <div className="head-actions">
          <div className="unit-toggle" aria-label="Unit system">
            <button className={s.system === "SI" ? "active" : ""} onClick={() => s.setSystem("SI")}>SI</button>
            <button className={s.system === "IP" ? "active" : ""} onClick={() => s.setSystem("IP")}>IP</button>
          </div>
          <button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(value => !value)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="icon-button" aria-label="Open saved history" onClick={() => setOpen(true)}>
            <History size={17} /><span>History</span><b>{s.history.length}</b>
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <small className="side-label">TOOLS</small>
          <nav role="tablist" aria-label="HVAC tools">
            {tools.map(tool => {
              const Icon = tool.icon;
              return <Link key={tool.id} role="tab" aria-selected={path === tool.href} tabIndex={path === tool.href ? 0 : -1} onKeyDown={handleTabKey} className={path === tool.href ? "nav-item active" : "nav-item"} href={tool.href}><Icon size={18} />{tool.title}</Link>;
            })}
          </nav>
          <hr />
          <small className="side-label">SETTINGS</small>
          <label className="field-label">Barometric pressure</label>
          <div className="pressure">
            <input aria-label={"Pressure " + (s.system === "SI" ? "kPa" : "psi")} type="number" inputMode="decimal" value={s.system === "SI" ? s.pressure : fromSI("pressure", s.pressure, "IP")} onChange={event => s.setPressure(s.system === "SI" ? (Number(event.target.value) || 101.325) : toSI("pressure", Number(event.target.value) || 14.696, "IP"))} />
            <span>{s.system === "SI" ? "kPa" : "psi"}</span>
          </div>
          <p className="muted tiny">Shared by calculations</p>
          <button className="nav-item" onClick={() => setOpen(true)}><History size={18} />Saved results ({s.history.length})</button>
        </aside>
        <main className="main">{children}</main>
      </div>

      <nav role="tablist" aria-label="HVAC tools" className="mobile-tabs">
        {tools.map(tool => {
          const Icon = tool.icon;
          return <Link key={tool.id} role="tab" aria-selected={path === tool.href} tabIndex={path === tool.href ? 0 : -1} onKeyDown={handleTabKey} href={tool.href} className={path === tool.href ? "mobile-tab active" : "mobile-tab"}><Icon size={18} /><span>{tool.title}</span></Link>;
        })}
        <button className="mobile-tab" onClick={() => setMore(value => !value)}>•••<span>More</span></button>
      </nav>

      {more && <div className="more-sheet"><button onClick={() => { setMore(false); setOpen(true); }}>Saved history</button><button onClick={() => setMore(false)}>Close</button></div>}

      {open && <div className="overlay" onClick={() => setOpen(false)}>
        <section className="drawer" onClick={event => event.stopPropagation()}>
          <div className="drawer-head">
            <div><h2>Saved results</h2><p className="muted small">Reuse values in your calculations.</p></div>
            <button className="icon-button" aria-label="Close history" onClick={() => setOpen(false)}><X size={18} /></button>
          </div>
          {s.history.length === 0 ? <p className="empty">No saved results yet. Save a calculation to get started.</p> : groups.map(group => <div className="history-group" key={group.tool.id}>
            <h3>{group.tool.title}</h3>
            {group.items.map(result => <article className="history-item" key={result.id}>
              <strong>{result.label}</strong>
              <p className="muted tiny">{new Date(result.timestamp).toLocaleDateString()} · {result.values.length} values</p>
              <div className="history-values">{result.values.slice(0, 5).map(value => <span key={value.name}>{value.name}: {fromSI(value.quantity, value.siValue, s.system).toFixed(2)} {unitLabels[value.quantity][s.system === "SI" ? "si" : "ip"]}</span>)}</div>
              <div className="history-actions">
                <button onClick={() => { const name = prompt("Rename result", result.label); if (name?.trim()) s.rename(result.id, name.trim()); }}>Rename</button>
                <button onClick={() => s.remove(result.id)}><Trash2 size={13} /> Delete</button>
              </div>
              <div className="send-row">
                <select aria-label="Destination tool" value={target} onChange={event => setTarget(event.target.value)}>{tools.map(tool => <option key={tool.id} value={tool.id}>{tool.title}</option>)}</select>
                <button onClick={() => { s.setPending(result); setOpen(false); router.push(tools.find(tool => tool.id === target)?.href || "/psychrometrics"); }}>Send to…</button>
              </div>
            </article>)}
          </div>)}
          {s.history.length > 0 && <button className="btn btn-ghost full" onClick={() => { if (confirm("Clear saved history?")) s.clear(); }}>Clear all history</button>}
        </section>
      </div>}
    </div>
  );
}

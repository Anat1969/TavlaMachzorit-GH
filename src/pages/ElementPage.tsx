import ElementDetail from "../components/ElementDetail";
import { byZ } from "../data/elements";
import { go, href } from "../lib/router";

export default function ElementPage({ z }: { z: number }) {
  const e = byZ(Math.min(118, Math.max(1, z || 1)));
  return (
    <div className="page element-page">
      <nav className="crumbs" aria-label="פירורי לחם">
        <a href={href("")}>בית</a><span>/</span><a href={href("table")}>טבלת יסודות</a><span>/</span><span aria-current="page">{e.he}</span>
      </nav>
      <div className="glass pad">
        <ElementDetail e={e} full onPick={(nz) => go(`element/${nz}`)} />
      </div>
    </div>
  );
}

import { lazy, Suspense, useEffect } from "react";
import TopBar from "./components/TopBar";
import Toast from "./components/Toast";
import Home from "./pages/Home";
import { useRoute } from "./lib/router";
import { useApp } from "./state";

const LabPage = lazy(() => import("./pages/Lab"));
const Research = lazy(() => import("./pages/Research"));
const TablePage = lazy(() => import("./pages/TablePage"));
const ElementPage = lazy(() => import("./pages/ElementPage"));

const TITLES: Record<string, string> = { "": "בית", lab: "מעבדה", research: "מחקר", table: "טבלת יסודות", element: "יסוד" };

export default function App() {
  const route = useRoute();
  const { ready } = useApp();
  const page = route.path[0] || "";
  useEffect(() => { document.title = `${TITLES[page] || "טבלה מחזורית"} · טבלה מחזורית`; window.scrollTo(0, 0); }, [page]);

  return (
    <>
      <div className="orbs" aria-hidden="true"><i /><i /><i /></div>
      <TopBar current={page === "element" ? "table" : page} />
      <main className={"main main-" + (page || "home")}>
        {!ready ? <div className="boot">טוען את הנתונים שלך</div> : (
          <Suspense fallback={<div className="boot">טוען</div>}>
            {page === "lab" ? <LabPage route={route} />
              : page === "research" ? <Research />
              : page === "table" ? <TablePage />
              : page === "element" ? <ElementPage z={Number(route.path[1])} />
              : <Home />}
          </Suspense>
        )}
      </main>
      <Toast />
    </>
  );
}

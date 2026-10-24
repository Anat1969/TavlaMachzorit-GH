import { useApp } from "../state";

/** חיווי שמירה: שומר / נשמר / שגיאה. שגיאה נשארת עד שסוגרים אותה. */
export default function Toast() {
  const { toast, notify } = useApp();
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"} aria-live="polite">
      <span className="toast-dot" />
      <span>{toast.text}</span>
      {toast.kind === "error" && <button className="toast-x" onClick={() => notify(null)}>סגירה</button>}
    </div>
  );
}

"""בונה את src/data/elements.json מתוך Periodic-Table-JSON (Bowserinator, CC BY-SA 3.0).
הרצה: python3 scripts/build-elements.py <path/to/PeriodicTableJSON.json>
מוסיף שמות בעברית, קטגוריה מנורמלת ומספרים קוונטיים של האלקטרון המבדיל לפי כלל מדלונג."""
import json, sys, pathlib

HE = """מימן הליום ליתיום בריליום בור פחמן חנקן חמצן פלואור נאון נתרן מגנזיום אלומיניום צורן זרחן גופרית כלור ארגון
אשלגן סידן סקנדיום טיטניום ונדיום כרום מנגן ברזל קובלט ניקל נחושת אבץ גליום גרמניום ארסן סלניום ברום קריפטון
רובידיום סטרונציום איטריום זירקוניום ניוביום מוליבדן טכנציום רותניום רודיום פלדיום כסף קדמיום אינדיום בדיל אנטימון טלור יוד קסנון
צזיום בריום לנתן צריום פרסאודימיום נאודימיום פרומתיום סמריום אירופיום גדוליניום טרביום דיספרוסיום הולמיום ארביום תוליום איטרביום לוטציום
הפניום טנטלום טונגסטן רניום אוסמיום אירידיום פלטינה זהב כספית תליום עופרת ביסמוט פולוניום אסטטין ראדון
פרנציום רדיום אקטיניום תוריום פרוטקטיניום אורניום נפטוניום פלוטוניום אמריציום קיריום ברקליום קליפורניום איינשטייניום פרמיום מנדלביום נובליום לורנציום
רתרפורדיום דובניום סיבורגיום בוהריום האסיום מייטנריום דרמשטטיום רנטגניום קופרניציום ניהוניום פלרוביום מוסקוביום ליברמוריום טנסין אוגנסון""".split()
assert len(HE) == 118, len(HE)

CAT = {
    "alkali metal": "alkali", "alkaline earth metal": "alkaline", "transition metal": "transition",
    "post-transition metal": "post", "metalloid": "metalloid", "noble gas": "noble",
    "lanthanide": "lanthanide", "actinide": "actinide",
    "diatomic nonmetal": "nonmetal", "polyatomic nonmetal": "nonmetal",
}

def madelung():
    """סדר מילוי: (n, l, ml, ms) לכל אלקטרון לפי n+l ואז n; בתוך תת-קליפה כלל הונד."""
    subs = sorted(((n, l) for n in range(1, 9) for l in range(0, min(n, 4))), key=lambda s: (s[0] + s[1], s[0]))
    out = []
    for n, l in subs:
        k = 0
        for ms in (0.5, -0.5):
            for ml in range(-l, l + 1):
                out.append({"n": n, "l": l, "ml": ml, "ms": ms, "k": k})
                k += 1
    return out

def main(src):
    raw = json.load(open(src, encoding="utf-8"))["elements"][:118]
    q = madelung()
    els = []
    for i, e in enumerate(raw):
        z = e["number"]
        assert z == i + 1
        c = e["category"]
        predicted = c.startswith("unknown")
        if predicted:
            c = next((v for k, v in CAT.items() if k in c), "transition")
        else:
            c = CAT[c]
        if z in (9, 17, 35, 53):
            c = "halogen"
        r = e.get("atomic_radii") or {}
        rad = (r.get("empirical") or r.get("calculated") or [None])[0]
        ie = e.get("ionization_energies") or []
        els.append({
            "z": z, "sym": e["symbol"], "he": HE[i], "en": e["name"],
            "mass": round(e["atomic_mass"], 4), "cat": c, "pred": predicted,
            "group": e["group"], "period": e["period"], "x": e["xpos"], "y": e["ypos"],
            "shells": e["shells"], "conf": e["electron_configuration"], "confS": e["electron_configuration_semantic"],
            "eneg": e.get("electronegativity_pauling"), "melt": e.get("melt"), "boil": e.get("boil"),
            "density": e.get("density"), "phase": (e.get("phase") or "").lower(),
            "ie1": ie[0] if ie else None, "ea": e.get("electron_affinity"), "radius": rad,
            "cpk": e.get("cpk-hex"), "disc": e.get("discovered_by"),
            "q": q[i],
        })
    out = pathlib.Path(__file__).resolve().parent.parent / "src/data/elements.json"
    out.write_text(json.dumps(els, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", out, len(els))

main(sys.argv[1])

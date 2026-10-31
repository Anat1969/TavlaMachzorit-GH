# Rebuilds src/data/oxidation.ts from the mendeleev library. Usage: pip install mendeleev && python3 scripts/fetch-oxidation.py
from mendeleev import element
from mendeleev.fetch import fetch_table
t = fetch_table('elements'); rows = []
for _, r in t.iterrows():
    if r.atomic_number > 118: continue
    e = element(r.symbol); common = sorted(set(e.oxistates or []))
    allst = sorted(set(o.oxidation_state for o in e._oxidation_states) | set(common))
    rows.append(f"{r.symbol}:[[{','.join(map(str, common))}],[{','.join(map(str, allst))}]]")
print(', '.join(rows))

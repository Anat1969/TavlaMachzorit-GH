# Rebuilds the AVAIL table in src/data/availability.ts from the mendeleev library (CRC Handbook values).
# Usage: pip install mendeleev && python3 scripts/fetch-availability.py  (prints the table body)
from mendeleev.fetch import fetch_table
t = fetch_table('elements')
for _, r in t.iterrows():
    if r.atomic_number <= 118:
        ab = r.abundance_crust
        print(f"{r.symbol}:[{'null' if ab != ab else '%g' % ab},{1 if r.is_radioactive else 0}],", end=' ')

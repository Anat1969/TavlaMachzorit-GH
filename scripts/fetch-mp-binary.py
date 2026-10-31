# Rebuilds src/data/mp-binary.json from the Materials Project open data (no API key).
# Usage: pip install duckdb && python3 scripts/fetch-mp-binary.py
# The S3 key contains a literal "%2B", so the URL spells it "%252B".
import duckdb, json
VERSION = "2026-09-28"
URL = ("https://materialsproject-build.s3.amazonaws.com/collections/thermo/version=" + VERSION +
       "/thermo_type=GGA_GGA%252BU_R2SCAN/part-00000-1d7aaed7-c3a6-4ce9-9586-402e5daca4d4-c000.zstd.parquet")
con = duckdb.connect(); con.execute("INSTALL httpfs; LOAD httpfs;")
rows = con.execute(f"""SELECT formula_pretty, composition_reduced, material_id, energy_above_hull,
  formation_energy_per_atom, symmetry.symbol, decomposes_to FROM read_parquet('{URL}')
  WHERE nelements = 2 AND (deprecated IS NULL OR deprecated = false)""").fetchall()
best = {}
for f, comp, mid, eh, ef, sg, dec in rows:
    if eh is None: continue
    key = ''.join(f"{e}{int(round(n))}" for e, n in sorted(comp.items()))
    if key not in best or eh < best[key][2]:
        best[key] = [f, mid, round(eh, 3), None if ef is None else round(ef, 3), sg, [x['formula'] for x in (dec or [])][:3]]
json.dump(best, open('src/data/mp-binary.json', 'w'), separators=(',', ':'))
print(len(best), 'binary compositions')

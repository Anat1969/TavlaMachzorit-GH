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

# Properties for the function checks (src/data/mp-props.json), from the summary collection:
# [energy_above_hull, band_gap (eV, GGA), density (g/cm3), point group, shear modulus VRH (GPa), max piezo e_ij (C/m2), experimental 0|1]
SUMMARY = ("https://materialsproject-build.s3.amazonaws.com/collections/summary/version=" + VERSION +
           "/part-00000-2cc5f2cc-2a79-4051-b013-2f9dec6a302e-c000.zstd.parquet")
rows = con.execute(f"""SELECT composition_reduced, energy_above_hull, band_gap, density, symmetry.point_group,
  shear_modulus, e_ij_max, theoretical FROM read_parquet('{SUMMARY}')
  WHERE nelements = 2 AND (deprecated IS NULL OR deprecated = false)""").fetchall()
props = {}
for comp, eh, gap, dens, pg, G, eij, theo in rows:
    if eh is None: continue
    key = ''.join(f"{e}{int(round(n))}" for e, n in sorted(comp.items()))
    g = G.get('vrh') if G else None
    rec = [round(eh, 3), None if gap is None else round(gap, 2), None if dens is None else round(dens, 2), pg,
           None if g is None else round(g), None if eij is None else round(eij, 2), 0 if theo else 1]
    cur = props.get(key)
    if cur is None or eh < cur[0]:
        if cur and cur[6]: rec[6] = 1
        props[key] = rec
    elif not theo:
        cur[6] = 1
json.dump(props, open('src/data/mp-props.json', 'w'), separators=(',', ':'))
print(len(props), 'binary compositions with properties')

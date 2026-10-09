# Space-diner tables for Tentacle Burger Station, built in Blender by code.
# 4 table types (1, 2, 4, 5 seats) x 5 upgrade levels. Low poly, colour per corner (no pictures).
# Output: JSON with, per variant, positions / normals / colours / indices in the game's axes (y up).
# Colour (1, 0, 1) is a marker: the game paints it in the wing's colour (purple Wing 1, blue Wing 2).
import math, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artlib import *

TOP_R = {1: 0.4, 2: 0.45, 4: 0.55, 5: 0.68}
TOP_Y = 0.76  # top surface height (plates sit at 0.81)

def seat_layout(s):
    if s == 1: return [(0.72, 0)]
    if s == 2: return [(-0.75, 0), (0.75, 0)]
    if s == 4: return [(-0.82, 0), (0.82, 0), (0, -0.82), (0, 0.82)]
    return [(math.sin(math.pi + i / s * math.pi * 2) * 1.02, math.cos(math.pi + i / s * math.pi * 2) * 1.02) for i in range(s)]

def table(s, lv):
    clear()
    r = TOP_R[s]; square = s == 4; seg = 20 if r > 0.5 else 16
    gold = lv >= 4
    trim = GOLD if gold else ACCENT
    # ---- base: foot + stem (level 3+: a hover disc with a glowing ring under it)
    if lv >= 2:
        cyl(0.34, 0.30, 0.06, 0, 0.0, 0, seg=14, col=METAL_D, bevel=0.015)
        torus(0.30, 0.025, 0, 0.075, 0, col=GLOW, seg=14, mseg=3)
    else:
        cyl(0.30, 0.26, 0.05, 0, 0.0, 0, seg=12, col=METAL_D, bevel=0.012)
    cyl(0.08, 0.06, TOP_Y - 0.12, 0, 0.05, 0, seg=8, col=METAL)
    cyl(0.16, 0.10, 0.06, 0, TOP_Y - 0.13, 0, seg=8, col=METAL)  # cap under the top
    # ---- top
    th = 0.07
    topcol = [WHITE, WHITE, SAND, ACCENT, NAVY][lv]
    if square:
        box(r * 2, th, r * 2, 0, TOP_Y - th, 0, col=topcol, bevel=0.03)
        box(r * 2 + 0.07, 0.035, r * 2 + 0.07, 0, TOP_Y - th - 0.02, 0, col=trim, bevel=0.012)
    else:
        cyl(r, r, th, 0, TOP_Y - th, 0, seg=seg, col=topcol, bevel=0.025)
        cyl(r + 0.035, r + 0.035, 0.035, 0, TOP_Y - th - 0.02, 0, seg=seg, col=trim, bevel=0.01)
    # level 2+: glowing strip set into the top edge
    if lv >= 1:
        if square:
            for k in range(4):
                a = k * math.pi / 2
                box(r * 2 - 0.12, 0.012, 0.035, math.sin(a) * (r - 0.06), TOP_Y - 0.002, math.cos(a) * (r - 0.06), col=GLOW if lv < 4 else GOLD, rz=a)
        else:
            torus(r - 0.06, 0.016, 0, TOP_Y + 0.002, 0, col=GLOW if lv < 4 else GOLD, seg=seg, mseg=3)
    # level 3: planet band on the sand top; level 4+: Saturn ring around the table
    if lv == 2:
        if square: box(r * 2 - 0.02, 0.008, 0.16, 0, TOP_Y, 0, col=SAND_D)
        else: cyl(r - 0.08, r - 0.08, 0.008, 0, TOP_Y, 0, seg=seg, col=SAND_D); cyl(r - 0.2, r - 0.2, 0.012, 0, TOP_Y, 0, seg=seg, col=SAND)
    if lv >= 3:
        rr = (r * 1.41 if square else r) + 0.12
        torus(rr, 0.035, 0, TOP_Y - 0.05, 0, col=trim, seg=20 if not square else 16, mseg=4)
    # level 4+: a tiny planet in the middle (small: plates go around it)
    if lv >= 3:
        cyl(0.05, 0.07, 0.03, 0, TOP_Y, 0, seg=10, col=METAL_L)
        sph(0.075, 0, TOP_Y + 0.11, 0, col=GLOW if lv == 3 else GOLD, seg=10, rings=6)
        torus(0.11, 0.012, 0, TOP_Y + 0.11, 0, col=WHITE if lv == 3 else ACCENT, seg=12, mseg=3).rotation_euler = (0.45, 0.2, 0)
    # MAX: stars on the dark top
    if lv == 4:
        n = {1: 3, 2: 4, 4: 6, 5: 7}[s]
        for i in range(n):
            a = i / n * math.pi * 2 + 0.3; d = (r * (1.2 if square else 1)) * 0.62
            star(math.sin(a) * d, TOP_Y, math.cos(a) * d, 0.045, col=GOLD, rz=a)
    # ---- stools: a pod seat on a stem (level 2+: cushion; level 4+: little backrest; MAX: gold foot)
    for (dx, dz) in seat_layout(s):
        cyl(0.17, 0.14, 0.035, dx, 0.0, dz, seg=8, col=GOLD if gold else METAL_D)
        cyl(0.04, 0.04, 0.38, dx, 0.03, dz, seg=6, col=METAL)
        cyl(0.2, 0.22, 0.07, dx, 0.39, dz, seg=12, col=ACCENT, bevel=0.02)
        if lv >= 1: cyl(0.17, 0.17, 0.03, dx, 0.46, dz, seg=12, col=WHITE if lv < 4 else GOLD, bevel=0.01)
        if lv >= 3:
            d = math.hypot(dx, dz); ux, uz = dx / d, dz / d  # away from the table
            box(0.3, 0.26, 0.05, dx + ux * 0.19, 0.44, dz + uz * 0.19, col=ACCENT, bevel=0.02, rz=math.atan2(ux, uz))
    return export()

out = {}
for s in (1, 2, 4, 5):
    for lv in range(5):
        d = table(s, lv); out['%d_%d' % (s, lv)] = d
        print('seats', s, 'level', lv + 1, 'tris', len(d['idx']) // 3, 'verts', len(d['pos']) // 3)
json.dump(out, open(sys.argv[-1], 'w'))

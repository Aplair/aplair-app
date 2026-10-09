# Tentacle Pad (space incubator) for Tentacle Burger Station, built in Blender by code. 4 upgrade levels.
# Game axes, centred on the pad: x along the back wall (-1.2..1.2), z from the wall (-1) to the hall (+1), y up.
# The game's animated tentacles rise from the goo pool (centre x 0, z -0.35, surface y ~0.95-1.0) and the tentacle
# pile lies on the front tray (z +0.45, y 0.64): the model leaves room for both.
import math, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artlib import *
GOO, GOO_D = hx(0xd96fd0), hx(0x7b2a8e)

def pad(lv):
    clear()
    gold = lv >= 3
    trim = GOLD if gold else ACCENT
    # base platform with a coloured band, and a lighter deck on top
    box(2.3, 0.42, 1.9, 0, 0.0, 0, col=METAL_D, bevel=0.06)
    box(2.34, 0.07, 1.94, 0, 0.2, 0, col=trim, bevel=0.02)
    box(2.16, 0.07, 1.76, 0, 0.42, 0, col=METAL_L, bevel=0.025)
    # feet: little hover pads
    for sx in (-0.95, 0.95):
        for sz in (-0.75, 0.75):
            cyl(0.16, 0.12, 0.05, sx, -0.02, sz, seg=10, col=GLOW if lv >= 1 else METAL)
    # goo pool (the incubator) at the back
    cyl(0.62, 0.66, 0.42, 0, 0.47, -0.35, seg=20, col=METAL, bevel=0.03)
    torus(0.6, 0.05, 0, 0.9, -0.35, col=trim, seg=22, mseg=5)
    cyl(0.55, 0.55, 0.04, 0, 0.86, -0.35, seg=20, col=GOO)
    for i in range(5):  # bubbles on the goo
        a = i * 1.3 + 0.4; d = 0.18 + (i % 3) * 0.1
        sph(0.035 + (i % 2) * 0.02, math.sin(a) * d, 0.905, -0.35 + math.cos(a) * d, col=GOO_D if i % 2 else hx(0xf2b6e6), seg=8, rings=5)
    # windows on the pool (glow from Lv 2)
    for k in range(5):
        a = -0.9 + k * 0.45
        box(0.13, 0.17, 0.03, math.sin(a) * 0.645, 0.58, -0.35 + math.cos(a) * 0.645, col=GOO if lv >= 1 else METAL_L, bevel=0.012, rz=a)
    # front tray where the tentacles pile up (the game draws them at y 0.64)
    box(1.62, 0.1, 0.7, 0, 0.49, 0.45, col=METAL_D, bevel=0.025)
    box(1.5, 0.04, 0.58, 0, 0.56, 0.45, col=WHITE if not gold else GOLD)
    # side tanks with a glowing window
    for sx in (-1.0, 1.0):
        cyl(0.17, 0.17, 0.55, sx, 0.49, -0.55, seg=12, col=WHITE, bevel=0.02)
        sph(0.17, sx, 1.04, -0.55, col=trim, seg=12, rings=6, sy=0.6)
        box(0.05, 0.25, 0.12, sx * 0.84, 0.62, -0.55, col=GLOW if lv >= 1 else METAL)
    # Lv 2+: glowing strip along the front edge and lamps
    if lv >= 1:
        box(1.9, 0.03, 0.03, 0, 0.3, 0.97, col=GLOW)
        for sx in (-0.85, 0.85): sph(0.06, sx, 0.52, 0.83, col=GLOW, seg=8, rings=6)
    # Lv 3+: antenna dish on the back right, ring arches over the pool
    if lv >= 2:
        cyl(0.03, 0.03, 0.55, 0.95, 1.12, -0.75, seg=6, col=METAL)
        o = cyl(0.26, 0.06, 0.1, 0.95, 1.62, -0.75, seg=14, col=WHITE, rot=(0.7, 0.0, -0.6))
        sph(0.04, 0.95, 1.75, -0.6, col=GLOW, seg=8, rings=5)
        t = torus(0.72, 0.03, 0, 1.12, -0.35, col=GLOW, seg=24, mseg=4)
    # MAX: gold everywhere above, a planet badge and stars on the front
    if lv >= 3:
        sph(0.12, 0, 0.27, 0.99, col=GOLD, seg=12, rings=8, sy=0.8)
        torus(0.17, 0.02, 0, 0.27, 0.99, col=WHITE, seg=14, mseg=3)
        for sx in (-0.62, 0.62): box(0.08, 0.08, 0.02, sx, 0.25, 0.975, col=GOLD, rz=0.785)
    return export()

out = {}
for lv in range(4):
    d = pad(lv); out['pad_%d' % lv] = d
    print('pad level', lv + 1, 'tris', len(d['idx']) // 3)
json.dump(out, open(sys.argv[-1], 'w'))

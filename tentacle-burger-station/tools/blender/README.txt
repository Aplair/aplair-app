Art made by code in Blender (not part of the game upload: the game only needs index.html, css, js, vendor).

Needs Python with the Blender module:  pip install bpy==5.2.2
  python3 tables.py tables.json            -> builds the 20 tables (4 seat counts x 5 levels)
  python3 tojs.py tables.json ../../js/models/tables.js   -> writes the game file

Style rules for every piece: simple low-poly shapes, colour per corner (no pictures), space / planets theme,
colour (1, 0, 1) = the wing's colour (purple Wing 1, blue Wing 2), cyan glow, gold at MAX level.

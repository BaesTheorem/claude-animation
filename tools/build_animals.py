"""Convert the CC0 Quaternius animals to smooth-shaded GLBs (facets merged so the pencil shader reads form, not polygons).

    blender -b --factory-startup -P tools/build_animals.py -- assets/quaternius/animals/glTF assets/animals Cow Bull Horse Husky
"""
import bpy, os, sys, bmesh
argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT, NAMES = os.path.abspath(argv[0]), os.path.abspath(argv[1]), argv[2:]
os.makedirs(OUT, exist_ok=True)
for n in NAMES:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, n + '.gltf'))
    for o in [o for o in bpy.data.objects if o.type == 'MESH']:
        bm = bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=.0005)
        bm.to_mesh(o.data); bm.free()
        for p in o.data.polygons:
            p.use_smooth = True
        for i, s in enumerate(o.material_slots):
            if s.material:
                s.material.name = 'hide' if i == 0 else 'hide%d' % i
    for img in list(bpy.data.images):
        bpy.data.images.remove(img)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, n + '.glb'), export_format='GLB', export_animations=True,
                              export_image_format='NONE', export_skins=True, export_yup=True)
    print('wrote', n)

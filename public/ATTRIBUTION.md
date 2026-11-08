# Anatomy data attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The source contains 2,234 individual OBJ meshes; all remain represented. The combined hierarchy contains 3,432 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Female anatomy

Female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.

Endocrine supplement: the HRA female set contains no endocrine structures. The four endocrine meshes (left and right adrenal glands, pituitary gland, pineal body) come from the male BodyParts3D 4.0 reference (same CC BY 4.0 license family) and are transplanted by landmark registration: each adrenal is placed against the kidney of the same side, the pituitary and pineal body against the brain region, keeping the male offset from that landmark with a clamped uniform scale. They are male reference geometry, not from the female subject. Regenerate or remove them with `node scripts/merge-female-endocrine.mjs` / `--undo`.

Skeletal supplement: the HRA female set ships only the spine, sacrum, knee joints, and the pelvis as bones. The remaining 241 skeletal meshes — the thoracic cage (24 ribs, costal cartilages, sternum), skull with mandible and 28 teeth, larynx cartilages, shoulder girdle, upper limbs, feet, and intervertebral disks — come from the male BodyParts3D 4.0 reference and are transplanted in groups, each registered to female landmarks: every rib and costal cartilage to its same-numbered thoracic vertebra, the sternum and shoulder girdle to the upper thoracic vertebrae, the skull to the brain envelope (capped under the scalp), the feet to the tibia and fibula of the same side, and each disk to its two adjacent vertebrae. The arms additionally rotate rigidly about the shoulder onto the female skin's arm axis, matching the figure's wide A-pose. These are registered approximations of male reference geometry, not native female bones; soft tissue misclassified as skeletal in the male set (leg and shoulder muscles, gingiva) is not copied. The pelvis itself is native HRA geometry: its twelve compact/trabecular tissue meshes are renamed from their generic dataset names ("compact bone of right ilium") and grouped into Left/Right hip bone concepts for search and selection. Regenerate or remove the supplement with `node scripts/merge-female-skeletal.mjs` / `--undo`. Muscles are not transplanted: the HRA set ships only sixteen muscle meshes, and BodyParts3D's male musculature would misrepresent the female torso; a muscular transplant script exists (`scripts/merge-female-muscular.mjs`) but is not applied.

## Skin cross-section

The skin cross-section catalogue is an original schematic model generated procedurally by this project (`scripts/build-skin-model.mjs`) — no external geometry is used. It shows the epidermis, dermis, and hypodermis with a wavy dermal-epidermal junction, hypodermal fat lobules, a hair with follicle, bulb, papilla, sebaceous gland, and arrector pili muscle, an eccrine sweat gland with its duct, capillary loops with superficial and deep dermal plexuses, and free nerve endings with a tactile corpuscle. Structures are enlarged for visibility: the section represents roughly 3 mm of skin displayed at body scale (~250x). It is an educational schematic, not scan data, and is not a clinical tool.

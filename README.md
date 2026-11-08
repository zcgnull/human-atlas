# Human Atlas

An interactive 3D anatomy explorer built with React, Three.js, and shadcn/ui. Switch between male and female reference anatomy. Take the BodyParts3D adult male reference apart into **2,234 individually selectable meshes** with **3,432 named concepts**, or explore the Human Reference Atlas female assembly of **888 meshes** and **1,073 selectable source nodes** across **15 anatomical systems**.

**[Explore the live demo](https://human-atlas-seven.vercel.app)**

## Explore

- Choose male or female anatomy; the geometry, catalogue, and available systems change together.
- Use the viewer in English or Chinese; the language follows the browser and can be pinned with `?lang=`. Common anatomical structure names display in Chinese; rare ones fall back to the source English name.
- Orbit, zoom, and select structures directly on the body.
- Toggle individual systems or use skeleton and organ presets.
- Move from assembled anatomy to a spaced inventory of every visible piece.
- Search anatomical names and source identifiers.
- Isolate a selected structure and read its details.
- Fold the vessels and nerves that reach a structure into the study view with one command.
- Show atlas-plate labels — side columns with leader lines — for the selected structures.
- Play an illustrative heartbeat: a pulse of light through the arteries with each beat.
- Export the current 3D view as a PNG.
- Use compact controls and detail panels on mobile.

## Run locally

Requires Node.js 22.13 or newer. No API keys or accounts are needed.

```sh
npm ci
npm run dev
```

Open http://localhost:3016. To build the static site, run `npm run build`; the output is in `dist/`.

## Validate

```sh
npm run check
node scripts/validate-atlas.mjs
node scripts/validate-atlas.mjs atlas-female.json
node scripts/validate-interactions.mjs
npm run build
```

Validation covers mesh buffers, names and concept membership, nonoverlapping exploded layouts at desktop and mobile aspect ratios, search contracts, every agent tool contract (visibility, camera, focus, explode, reset, snapshot), the embed protocol constants, and tap-versus-drag handling. Browser interaction checks have exercised selection, system controls, search, isolation, rotation, and 390×844, 320×568, and 844×390 layouts, plus cross-origin embed control through the example host. Phone controls stay clear of the exploded inventory, and isolated structures fit the space above or beside the detail panel. Physical-device performance and real multitouch hardware have not been tested.

## Anatomy data

The male viewer uses **BodyParts3D 4.0**, an adult male reference anatomy, licensed **CC BY 4.0**. The female viewer uses the **Human Reference Atlas** *3D Reference Organ Set for Female v1.5* (HuBMAP), also **CC BY 4.0**; it includes the whole-body surface, selected organs, and female reproductive anatomy, with partial skeleton and muscle coverage. Neither dataset represents every human structure or variation. Individual source meshes are distinct from named concepts, which may group multiple meshes. Descriptions distinguish general system context from individual organ explanations.

Male geometry is simplified for browser performance while retaining every source mesh. The packaged male model contains 2,288,268 triangles and downloads approximately 33 MB of compressed geometry; the female model contains 1,810,038 triangles in approximately 25 MB. Full credits, source links, and adaptation details are in [ATTRIBUTION.md](public/ATTRIBUTION.md).

This is an educational explorer, not a diagnostic or surgical tool.

## How it works

Geometry is merged into batches. Per-structure GPU textures control translation, visibility, and selection, while component geometry supports accurate picking. Exploded layouts pack only the visible pieces. Rendering updates when the scene changes; orbit controls remain responsive without thousands of separate draw calls.

The optional WebMCP tools expose search, inspection, camera, layer, and scene control in compatible browsers. The same tool surface is available to host systems through a versioned postMessage bridge, so the viewer can be embedded in larger applications and driven by agents or backends. See [EMBEDDING.md](EMBEDDING.md); the visible interface works entirely without either.

## Rebuilding geometry

The repository includes browser-ready geometry. Rebuilding it is optional: obtain the official BodyParts3D OBJ archive and English metadata tables, prepare the joined concepts and display-system mappings, run `scripts/convert-anatomy.py`, then `node scripts/optimize-anatomy.mjs` and `node scripts/compress-models.mjs`. Simplification uses a 0.2% relative error limit per structure. Rebuild the female atlas with `scripts/convert-female.py` and `node scripts/optimize-anatomy.mjs atlas-female.json`, then `node scripts/compress-models.mjs`.

## Deploy

Import this repository into Vercel as a Vite project. The included `vercel.json` configures `npm ci`, `npm run build`, and the `dist` output directory. It can also be served by a static host.

## License

Original application code is released under the [MIT License](LICENSE). **The anatomy data has its own CC BY 4.0 license**; preserve the attribution when redistributing it. Third-party dependencies retain their respective licenses.

Issues and pull requests are welcome. Please include reproduction steps and browser/device details for interaction problems.

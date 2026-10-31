# Mission 2 device models

These local GLB files are used by the Mission 2 Component Lab. They are self-contained glTF assets; models stay local so the game does not need a model CDN while running.

| File | Asset | Source | License | Triangles |
| --- | --- | --- | --- | ---: |
| `cpu-processor-chip.glb` | Processor Chip (Scavenger's Loot Library) | https://3dassets.dev/assets/scavengers-loot-library-processor-chip-759ea291 | CC0 1.0 Universal | 1,512 |
| `ram-memory-module.glb` | Memory Module (Scavenger's Loot Library) | https://3dassets.dev/assets/scavengers-loot-library-memory-module-12c86a55 | CC0 1.0 Universal | 2,268 |
| `bookshelf-speaker.glb` | Bookshelf speaker (Computers and Desk Gadgets) | https://3dassets.dev/assets/computers-and-desk-gadgets-speaker-bookshelf-90b50703 | CC0 1.0 Universal | 602 |

The three models above were downloaded from the permanent CDN URLs in the public asset manifests:

- https://cdn.3dassets.dev/assets/2470/v1/model.glb
- https://cdn.3dassets.dev/assets/2469/v1/model.glb
- https://cdn.3dassets.dev/assets/38854/v1/model.glb

The asset catalogue identifies the CPU and RAM models as AI-generated (attribution reported by the asset publisher); they are low-poly models, not photogrammetry scans.

## Real-material device set

Mission 2 uses the following CC0 GLBs for the visible monitor, keyboard, mouse, speaker, and router. Their embedded PBR image maps, including normal maps, give the plastic, glass, fabric, and metal surfaces material detail under scene lighting.

| Local file | Model | Source | License |
| --- | --- | --- | --- |
| `monitor-pbr.glb` | Wide View - Ultrawide Monitor | https://www.innerscene.com/tools/library/3d-parts/wide-view-ultrawide-monitor-e43c45f7 | CC0 1.0 |
| `keyboard-pbr.glb` | Key Grid - Mechanical Keyboard | https://www.innerscene.com/tools/library/3d-parts/key-grid-mechanical-keyboard-8503e99e | CC0 1.0 |
| `mouse-pbr.glb` | Palm Mouse - Wireless Mouse | https://www.innerscene.com/tools/library/3d-parts/palm-mouse-wireless-mouse-a9f5ed66 | CC0 1.0 |
| `speaker-pbr.glb` | Studio Two - Bookshelf Speaker | https://www.innerscene.com/tools/library/3d-parts/studio-two-bookshelf-speaker-41658b0e | CC0 1.0 |
| `router-pbr.glb` | Router Twin - Wi-Fi Router | https://www.innerscene.com/tools/library/3d-parts/router-twin-wi-fi-router-5bf2a400 | CC0 1.0 |

CPU and RAM still use the compact CC0 models above. Those files have no texture coordinates or image maps, so their material colors and metallic/roughness values are tuned in the scene to read as PCB, silicon, and electrical contacts.

External SSD continues to use the CC0 Computer and Desk Gadgets model documented in `../mission1/ASSET_SOURCES.md`.

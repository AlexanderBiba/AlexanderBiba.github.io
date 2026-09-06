# Alex’s house

An experimental Three.js route at `/play/`. The classic homepage, blog, and projects remain in place. All content lives in the repository.

## Run

Run `npm run dev`, then open `http://localhost:3000/play/` (use the port printed by Next.js).

- Arrow keys: walk in screen directions.
- Click or tap the floor: walk to a point, routing around furniture. Mobile uses tapping, with no directional pad or action button. The nearby E popover is also tappable.
- Click or tap a golden-diamond object: walk over and open its story.
- E / Space: interact with a nearby object (Space while the canvas is focused).
- Stairs and doors: click or tap to walk over and enter automatically; when walking with arrow keys, press E nearby to enter. No confirmation dialog. Floor buttons also allow direct travel.
- House menu: keyboard-accessible, text-only access to every story.
- E / Enter / Space: finish the current line, then continue. Arrow keys select dialogue choices (including Continue); E / Enter / Space activate the focused choice. Dialogs consume these keys before the world can handle them.
- Escape: run the same close action as the X button.
- Sounds are off by default; the sound button enables synthesized interaction and walking sounds.

## Content and models

- The shared `content/` indexes provide profile, project, and writing data; article bodies are Markdown and images live in `public/content/`.
- `content.ts` contains the room names and object stories. Alex is bald with a brown beard; Lola is a sandy Labrador–German Shepherd mix. Personal names, appearances, and details can be customized here and in `world.ts`.
- `world.ts` builds the three original low-poly dioramas, characters, furniture, and animations from Three.js geometry. No remote model or texture downloads are needed.
- `engine.ts` owns rendering, raycasting, movement, audio, and cleanup.
- `navigation.ts` handles collision detection, pathfinding with clear-line shortcuts, and continuous movement across waypoints to exact click destinations. Walking poses blend into idle, and the canvas becomes visible only after its first rendered frame.
- `House.tsx` and `house.module.css` provide the responsive interface, dialogs, touch controls, and WebGL fallback.

The interface uses the locally bundled VT323 pixel font (SIL OFL license in `public/fonts/VT323-OFL.txt`), opaque bottom dialogue boxes, and a reduced-resolution 3D canvas. Reduced-motion settings disable typewriter text and idle animation.

The baby sits on a play mat in the living room, beside a kitchen with cabinets, a sink, stove, and fridge. The wife and dog patrol the open floor, pause near the player, and stop when clicked so their interaction points stay reachable. The upstairs staircase is cut into all floor layers. People, the dog, stairs, and the car support interactions from all accessible sides. The yard includes the two-story house and a back door; transitions spawn at the corresponding stairs or doorway. A closed fence and driveway gate enclose the playable property. The surrounding NJ neighborhood is decorative, with varied homes, mature trees, sidewalks, streets and everyday objects; its static geometry is batched by material. Each room starts with its outline fitted closely to the available window. Outside, zooming out reveals a grid of nine blocks with complete crosswalks, street-facing houses, front and back lawns, driveways and parked cars. Alex’s original backyard facade stays in place on a deeper house, with a street-facing entrance and front lawn behind it. Each room remembers its own zoom. Upstairs has matching blue walls, a bedside gallery, and an open-frame Bambu Lab A1 printer.

Both routes share site titles and profile descriptions from `content/site.json`.

## Verify

`node --test tests/house-*.test.mjs` checks that every interaction and exit is reachable from the room spawn and all other interaction points, and that routes avoid furniture and floor boundaries. Requires Node.js with built-in TypeScript stripping (22.18+).

`npm run build` checks the complete Next.js production build. The build reads content locally and requires no CMS credentials.

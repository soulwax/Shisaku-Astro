---
title: 'Devlog #2 — Companions, Shaders, and the Modding Turn'
description: 'Companion AI, shader-driven NPC abilities, combat feel, and the point where EchoWarrior became a modding-first project.'
pubDate: '2026-06-24T18:00:00.000Z'
status: 'published'
tags:
  - companions
  - shaders
  - modding
  - gamedev
---
**Date:** June 24, 2026
**Versions covered:** v0.9.0 → v0.10.4

---

## The Problem With Silence

A few nights ago I was watching my daughter play with blocks. She was building a tower, knocking it down, rebuilding it slightly differently, narrating the whole thing in a language that is half-gibberish and half-profound. She did not need the tower to *do* anything. The tower was just an excuse for the conversation she was having with herself about it.

I went back to my desk and looked at EchoWarrior. The player character — Echo — was alone in the Splintered Garden. Enemies spawned, you killed them, you levelled up, you died or survived. Functional. But there was no one to share the space with. No one to follow you. No one whose presence changed how you moved through the world.

That is what the last ten days of work have been about.

---

## Companions (v0.9.0)

The first big piece was getting other characters to actually *behave* like they live in the world. Eve, Helena, Sophia, Siegfried, Enid — they had dialogue files, they stood in their assigned positions, you could walk up and press `[E]` to talk. But they were statues with text bubbles.

The companion AI changed that. I wrote a renderer-agnostic A* navigation grid (`src/game/navgrid.rs`) with 8-directional search and string-pull path smoothing. Companions now follow you in a formation ring when idle, fan out into combat positions when enemies appear, and use their abilities at staggered cooldowns so they feel like active participants rather than passive observers.

The data for all of this lives in `Assets/Data/companions.toml`. Formation radius, engagement distance, role thresholds — every number is moddable. I did this partly because it is the right architectural choice, and partly because I know that in six months I will want companions to behave completely differently, and I do not want to recompile to find out if my new numbers work.

I also wrote a navigation grid with obstacle blockers defined in `Assets/Data/world.toml`. The old approach was decorative fences that did nothing. The new approach is data-driven rectangles and circles that the A* pathfinder actually routes around. When my daughter is old enough to draw walls on graph paper and ask why the NPCs walk through them, I want the answer to be "they should not — let me show you how to fix it."

---

## NPC Abilities and Shaders (v0.7.0 → v0.9.6)

The companion system needed companions that could *do* things. So I built a cooldown ability system driven entirely by `Assets/Data/abilities.toml`.

Each NPC has a loadout: a list of abilities with cooldowns, radii, damage, push/pull values, and optional heal amounts. The runtime reads these, assigns staggered timers, and casts them during combat. The visual effects are GLSL shaders — `ward`, `snare`, `lance`, `burst`, `pulse`, `chain`, `void` — each registered in `shaders.toml` and loaded by id.

Writing the shaders was the most fun I have had on this project. The `void` shader is a collapsing 3-arm gravity spiral with an accretion disc ring. The `chain` shader is a multi-layered lightning bolt between two points with noise-driven flicker. The `pulse` shader is a rhythmic concentric heal aura. They are not complicated shaders — maybe 40 lines each — but watching them render for the first time, seeing the companions actually cast these effects during gameplay, was the moment the game started feeling like a *game* rather than a prototype.

Five new abilities shipped in v0.9.6, one per companion. Eve gets prismatic chain lightning with pull. Helena gets a restoration pulse that heals 18 HP per cast. Siegfried gets void gravity well. Enid gets a wide pulse heal with a shield grant. Sophia gets a heavier chain lightning. By the time I had tested all five, I had spent three hours past my daughter's bedtime and did not regret a single minute of the sleep debt.

---

## The Modding Turn (v0.9.1 → v0.9.5)

Around this point the project took a sharp philosophical turn. I had been building systems that were data-driven because it was efficient. But I realised I was optimising for *myself* — for my own iteration speed — and not for the person who downloads the game and wants to change it.

That realisation changed everything.

The question became: what if someone wants to turn EchoWarrior into a coffee shop simulator? A visual novel about gardening? A bullet hell where you play as the slime? Not hypothetically — what if my daughter, ten years from now, opens the repo and wants to make something completely different out of it? Does the architecture say *yes* before she finishes typing?

So I started ripping out every remaining hardcoded assumption.

**Dynamic enemy identity** (v0.9.1): `EnemyRuntime` stopped using a Rust enum. Now it reads stats, sprite keys, and frame metadata from `enemies.toml`. Adding a new enemy is a TOML entry and a Lua spawn command. No Rust. No recompile. Unknown ids from Lua are logged and skipped — the game never crashes on a bad spawn command, because the first thing a new modder will do is typo an enemy name, and the game should help them find it, not punish them for it.

**GUI moddability** (v0.9.5): Every label on the start screen, every HUD diagnostic, every game-over string moved into `ui.toml`. The file hot-reloads while the game is running — edit a label, save, see it change within a second. No restart. I added a slider for NPC SFX volume because a player on the modding Discord (which does not exist yet, but I am optimising for it) will want to hear their companions without the ability sounds drowning out the combat.

**Mod validation tool** (v0.10.3): `cargo run --bin mod_check` parses every TOML, YAML, and Lua file in the mod, validates id uniqueness and cross-references, and reports with ✓/⚠/✗ glyphs. Exit code 1 on errors. I wrote this because I spent an entire evening debugging a typo'd ability id and decided no one else should have to do that.

**Asset packing** (v0.9.4): The `data.pak` format now supports `--unpack`, so modders can decode a release pack into editable loose files. The unpacker rejects unsafe paths before writing. Release packaging stages `MODDING.md` inside the zip so players receive the modding guide with the build. I also wrote `asset_pack --unpack` so you can take any release apart, see how it works, and rebuild it differently. The pack is optionally encrypted with a repo-root key — not for DRM, just so casual browsing is not trivial. If you want to reverse-engineer the format, the code is open. I am not trying to hide anything.

---

## Combat Feel (v0.9.3 → v0.10.1)

A survivors-like game is nothing without juice. The past week I have been obsessed with making every hit feel readable.

Screen shake scales with damage — 2 px for a graze, 8 px for a boss hit — and decays over 0.25 seconds. Enemy hit flash is a white overlay that lasts exactly one frame update. Damage numbers float upward with gravity, bounce, and colour coding (white for player damage, red for enemy hits, yellow for procs). The XP bar now animates smoothly instead of jumping. Pickup magnets accelerate as they close — 1× speed at the outer radius, 3× right next to the player.

The level-up cards got the most polish. They now slide in from below with a cubic ease-out curve over 0.25 seconds, staggered 0.05 seconds apart so they feel like they are being dealt from a deck. Each card has a rarity badge in the top-right corner and a coloured outer glow matching its rarity tier. The game-over screen fades in over 0.8 seconds instead of slamming opaque.

None of these were hard to implement. They were each about 10-30 lines of code. But they transformed how the game *feels*, and that is the difference between a tech demo and something you want to keep playing.

---

## The One That Drove Me Crazy

The Y-axis fix in v0.9.1.

NPC nameplates were not tracking correctly on the vertical axis. I had been ignoring it for days because it was "just a visual bug." But every time I played, the name tags hovered slightly above or below where they should be, and it grated on a level I could not articulate.

Root cause: Macroquad's `Camera2D::from_display_rect` uses Y-up world coordinates. My world-to-screen projection was not inverting Y. Fixing it was a single line in `math_helpers.rs`:

```rust
screen_y = screen_height - (world_y - camera_top_left_y) * scale_y;
```

One line. I had been looking at this problem for three days. My daughter can build a tower and knock it down in thirty seconds and learn more about structural physics than I learned in three days of debugging a Y-axis projection. Some days I think she is the smart one in this family.

---

## What It Feels Like Now

Open the game. The start screen is storm-heavy — rain, lightning, the whole gothic atmosphere. Click Start Game. Leere appears in the dim light and starts talking. Their dialogue file is YAML; you could open it right now and change what they say.

After the intro, the garden opens up. Enemies start spawning from the edges. Your auto-attacks fire at the nearest target. XP gems drop and magnetise toward you. Level up — three cards slide in with rarity glows and badges. Pick one. The stats apply immediately. The run continues.

Your companions spread into formation around you. Eve casts prismatic chain at a distant enemy — the lightning forks through three targets. Helena pulses a heal aura. Siegfried drops a void well that pulls enemies inward while you pick them off. These are not scripted sequences. They are emergent from data files you can edit.

And every number — every cooldown, every damage value, every colour, every label, every spawn timing, every dialogue line — lives in a plain-text file under `Assets/`. You can change any of it without compiling anything.

That is the point. That is always the point.

---

## What Is Next

The immediate roadmap (Priority 1 in `TODO.md`) is full-control modding:

1. **General Lua event hooks** — `on_run_start`, `on_enemy_killed`, `on_player_hit`, `on_level_up_offer`. One API for all events.
2. **Shared effect model** — upgrades, abilities, and Lua commands all use the same stat-effect schema.
3. **Mod pack layout** — `Mods/<mod_id>/mod.toml` with metadata, versioning, and namespaced content.
4. **Scene TOML files** — prop placement, garden beds, and fences extracted from hardcoded Rust into data.
5. **Audio persistence** — save volume settings, lazy-load non-core SFX, dynamic music crossfade.

Beyond that: skill trees, legendary items, evolutions, full enemy roster, stages 2-6, endless mode, co-op.

But the truth is, the thing I am most excited about is handing this to someone who has never written code and watching them change something anyway. The architecture exists to make that possible. The rest is content.

---

My daughter is asleep. The baby monitor is quiet. I have maybe an hour before she wakes up and the whole cycle starts again. That is enough time to fix one bug, ship one feature, or write one more loader function that lets someone change the game without fighting the compiler.

Eighty minutes well spent.

---

*If you read this far: everything in `Assets/` is yours. `cargo run --bin mod_check` will tell you if you broke something. `Docs/MODDING.md` will tell you how to fix it. The game is built to be taken apart.*

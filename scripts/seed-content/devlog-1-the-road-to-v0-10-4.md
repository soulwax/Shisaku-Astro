---
title: 'EchoWarrior Devlog #1 — The Road to v0.10.4'
description: 'How EchoWarrior went from first assets to a playable, moddable Rust prototype in two and a half weeks.'
pubDate: '2026-06-24T09:00:00.000Z'
status: 'published'
tags:
  - rust
  - macroquad
  - lua
  - gamedev
---
**Published:** June 24, 2026
**Current version:** 0.10.4
**Stack:** Rust, Macroquad, Lua 5.4
**Build time:** ~2.5 weeks from first commit

---

## Who Made This

I'm a young neurologist from Germany. By day I map neural pathways and study how the brain constructs its sense of self — where memory lives, what happens when the internal critic gets too loud, how trauma reshapes perception. By night (and between nappy changes), I build a video game about a decommissioned consciousness archive whose archived minds leak out as monsters.

I have a daughter. She's too young to play it yet. But this game is partly for her: a world she can open up, take apart, and rebuild however she wants. A place where boundaries are permeable and transformation is possible. Also she thinks the slime enemy is funny, which is its own kind of validation.

EchoWarrior started as a side project — something to keep the Rust muscles flexed between hospital shifts. It became a 2.5-week sprint that produced 140 commits, a playable prototype, a full narrative framework, and an architecture designed from the ground up to be taken apart by anyone with a text editor.

This is the story of how that happened.

---

## What Is EchoWarrior?

EchoWarrior is a Rust-native top-down 2D survivors-like game with a gothic dark-fantasy soul. On the surface it looks like Vampire Survivors in a ruined cathedral: move with WASD, auto-attack the nearest enemy, collect XP gems, level up, snowball into spectacle. But beneath that familiar loop lives something stranger.

The enemies are not random monsters — they are **psychological archetypes** drawn from the unconscious: the repressed impulse (Shadow), the internalised critic (Judge), the false persona (Trickster), the bottomless hunger (Devourer). Every wave is a curriculum. Every kill is an integration.

The world is not a neutral arena — it is a **decommissioned consciousness archive**, a gargantuan server complex built three centuries ago to preserve dying minds. The minds inside began to *respond* — not with gratitude, but with demand. What leaked out was everything they had refused to face while alive.

This is the game's core tension: a survivors-like power fantasy wrapped around a story about the cost of becoming permeable to what you've avoided.

I did not plan this thematic coherence. It emerged because I spend my professional life thinking about what happens when the brain's filtering mechanisms break down, and it turns out that maps directly onto game design. The Shadow archetype is what neurologists call a disinhibited impulse circuit. The Judge is an overactive prefrontal feedback loop. The Trickster is a pattern-completion error that feels like insight. I did not design these as clinical analogies — I designed them as enemies. The fact that they map back to real neuroscience is just me showing my work.

---

## Phase 1: The Skeleton (June 8)

The project started the way most Rust game prototypes start: an `Initial commit of assets` followed immediately by a design document, a `Cargo.toml`, and a `main.rs` that opened a window.

The first commit was just assets — pixel-art spritesheets, a grass tileset, a player sprite, a skeleton enemy, a slime. No code. Just the raw material. This turned out to be a good instinct: having visual content from day one meant every technical milestone was immediately playable and visible.

The next day brought the first playable loop:

- A character moved around a tiled arena
- Enemies spawned and drifted toward the player
- Auto-attacks fired at the nearest target
- XP gems dropped on kill and magnetised toward the player
- Leveling paused the game and presented upgrade cards

All of this in about 900 lines of Rust, using Macroquad for the window, input, and rendering. The code was a single flat module — no data files, no ECS, no scripting. Just hardcoded arrays and `match` statements.

A sprite cutter tool followed quickly (`src/bin/sprite_cutter.rs`), because manually slicing 288×480 spritesheets into 48×48 frames is not a sustainable workflow. The tool read TOML metadata describing frame grids, row-to-animation mappings, and FPS hints, then wrote individual PNGs. This established a pattern that would define the entire project: **metadata-driven asset pipelines**.

### Design decision: Macroquad, not Bevy

Why Macroquad? Speed. Bevy's compile times, ECS boilerplate, and asset pipeline overhead would have slowed the feedback loop during the critical first week. Macroquad gave us a window, a render loop, input, audio, and text in a single `use macroquad::*` — no build scripts, no proc-macro-heavy framework. The trade-off was accepting a less structured codebase, which we solved by keeping pure game logic in `src/game/` and Macroquad-specific code in `src/runtime/`, with a hard import boundary between them. That separation survived every refactor since.

Also: I only get about 90 minutes of coding time after my daughter goes to sleep. I cannot afford a framework that spends 45 of those minutes compiling. Macroquad's compile times are short enough that I can actually ship something before I collapse.

---

## Phase 2: Architecture Takes Shape (June 8–12)

The prototype grew rapidly, and the flat-file approach started to creak. The solution was a modular split that is still in place today:

```
src/lib.rs          → pub mod declarations (game, data, runtime, ui, save, scripting, logging)
src/main.rs         → macroquad entry → runtime::run()
src/game/           → renderer-agnostic logic (combat, enemies, player, dialogue, ECS)
src/data/           → serde structs + load_* for every TOML data file
src/runtime/        → Macroquad-specific loop, rendering, input, audio
src/ui/             → renderer-agnostic layout + draw helpers
src/save/           → progression + autosave persistence
src/scripting/      → Lua 5.4 via mlua
```

This architecture made one promise: **you can change the game without touching Rust**. Every stat, spawn curve, upgrade, UI colour, shader manifest, dialogue line, and weather preset lives in `Assets/Data/*.toml` or `Assets/Dialogue/*.yaml`. A modder with a text editor can rewrite the entire game by swapping the `Assets/` directory.

The data-driven shift happened in a single intense day (June 12). Before that, player stats were hardcoded in `actors.rs`. After, everything came from TOML:

- `Assets/Data/player.toml` → `PlayerConfig`
- `Assets/Data/enemies.toml` → `HashMap<String, EnemyDef>`
- `Assets/Data/spawn.toml` → `SpawnConfig`
- `Assets/Data/upgrades.toml` → `Vec<UpgradeDef>`
- `Assets/Data/theme.toml` → `UiTheme` (with hot-reload!)
- `Assets/Data/shaders.toml` → runtime shader manifest

Every loader degrades gracefully. A missing or malformed file prints to stderr and falls back to hardcoded defaults. The game never crashes on bad data — a policy born from the recognition that modders will make mistakes, and the game should help them debug, not punish them. Also from the recognition that *I* will make mistakes, usually at 1 AM with a baby monitor on.

### The Lua gamble

Rust-powered modding usually means embedding Python or JavaScript. We tried `rustpython-vm` first. Windows 11 AppLocker killed it — OS error 4551, build scripts blocked.

Enter `mlua` with Lua 5.4 vendored. Lua compiles as a C library with no build scripts — it just works. The trade-off is a less familiar scripting language for many developers, but Lua's simplicity (one table, one function, one string type, no classes) turned out to be an advantage for modders who don't want to learn Rust.

The spawn system demonstrates the pattern:

```lua
-- Assets/Scripts/spawn.lua
function spawn_wave(ctx)
    if ctx.run_seconds < 60 then
        echo_warrior.spawn_enemy("ShadowLurker", ctx.player_x + 200, ctx.player_y)
    elseif ctx.run_seconds < 180 then
        echo_warrior.spawn_enemy("ShadeHound", ctx.player_x + 300, ctx.player_y)
    end
end
```

The `ctx` table exposes run state, player stats, XP progress, world dimensions, and spawn config — everything a modder needs to write adaptive wave logic. Hot-reload polls file mtimes every frame; changes take effect within one second without restarting the game.

Additive layers live in `spawn.d/*.lua`, letting multiple mods each register hooks without overwriting each other:

```lua
echo_warrior.on_spawn_wave("my_mod_waves", function(ctx)
    -- append extra spawns
end)
```

---

## Phase 3: The Story Emerges (June 12–14)

Between the architecture work came a curious thing: the game started telling a story where none was planned.

The design document had always described the enemy archetypes in psychological terms (Shadow, Judge, Trickster, Devourer). But during a late-night writing session — one of those rare nights where my daughter actually slept through — the setting crystallised. The Splintered Garden was not a magical place. It was a **decommissioned consciousness archive**. A vast, cathedral-scale server complex built to preserve dying minds. The enemies were not monsters. They were the archived material the minds could not process while alive.

This unlocked the narrative framework documented in `PCS.md`. The characters:

- **Echo** — the player, carrying an echo field (a resonance emitter) they built during a previous visit they no longer remember. The arrival without memory is not amnesia. It is a decision they no longer remember making.

- **Leere** — the NPC who greets Echo at the threshold. Leere is not a person. Leere is the facility's original curator AI, a maintenance system so old its social subroutines have developed something indistinguishable from weariness. The inability to leave is not loyalty. It is a hard constraint in the original build.

- **Eve** — a companion encountered standing in a doorway Echo has no record of. Eve is the last successful partial upload — a woman named Aveline Voss who compressed herself into a state small enough to exist in the archive's margins without being consumed.

The story has three endings:
- **The Closed Ending** — Echo disables the echo field, the archive falls silent
- **The Open Ending** — Echo consents to broadcast three centuries of archived consciousness outward
- **The Corruption Ending** — Echo hesitates at the threshold and is overwritten

This narrative depth is unusual for a survivors-like game, and it shapes every design decision. The enemy archetypes are not interchangeable — each one teaches the player something about the world and about themselves. The combat design doc (`Docs/COMBAT_LEVELING.md`) calls this "uniquely learned moves": repeatable, build-specific tactical behaviors that the player internalises over time, like knowing how to dash through a marked enemy to fork arrows into the rear line, or timing a guard into an incoming curse to convert punishment into retaliation.

The consciousness archive framing is not accidental. I spend my clinical days watching people process things their brains have walled off. The Shadow Lurker is the impulse they refused to examine. The Penitent Bell is the critical voice that stopped sounding like theirs. The game lets you fight these things, dissolve them, and feel heavier afterwards. That is the gameplay equivalent of what therapy feels like, and I did not realise I was building that until the third draft of the design document. Sometimes your subconscious writes better code than your conscious self.

---

## Phase 4: The Modding Turn (June 14–15)

Around v0.7.0, the project's direction shifted fundamentally. The question became: **what if someone wants to turn EchoWarrior into a completely different game?**

This "modding is the point" philosophy drove the next wave. I want my daughter to be able to open this game when she's old enough and change *anything* — turn enemies into cats, replace the soundtrack with her own recordings, rewrite the entire story, turn the Splintered Garden into a space station. Not because she has to, but because she *can*. A game that cannot be reshaped by its players is a lecture. A game that invites reshaping is a conversation.

- **Dynamic enemy identity**: `EnemyRuntime` reads stats, sprites, and frame metadata from `enemies.toml`. Adding a new enemy kind requires zero Rust code — just a TOML entry and a Lua spawn command. Unknown enemy ids from Lua are logged as warnings and skipped gracefully.

- **Asset packaging**: The `asset_pack` CLI discovers used assets, encodes them into EchoWarrior's internal format, writes `data.pak`, and optionally encrypts with a repo-root key. The packer auto-discovers `Assets/Data`, `Assets/Metadata`, `Assets/Scripts/**/*.lua`, and `Assets/Dialogue/*.yaml` without editing `asset_pack.rs`. Every change is verified with `--dry-run --list`.

- **Mod validation tool** (`cargo run --bin mod_check`): Parses all TOML, YAML, and Lua entry points, validates id uniqueness and cross-references, reports section-by-section with ✓/⚠/✗ glyphs. Exit code 1 on errors. Documented in `Docs/MODDING.md` as the first troubleshooting step for modders.

- **Modded profile system**: The start screen has a "Play Modded" toggle that persists across sessions. Vanilla and modded autosaves are separate files. Saves carry mod manifest metadata and custom TOML namespaces.

- **Maximum GUI moddability**: Start-screen labels, HUD diagnostics, game-over strings moved into `ui.toml`. Theme colours already hot-reloadable. The roadmap has every visible label, panel title, layout number, font size, and colour value coming from data.

---

## Phase 5: Combat Feel (Ongoing)

A survivors-like game sinks or swims on juice. The past week focused on making every hit read:

- **Enemy hit flash**: White semi-transparent overlay on `take_damage`, 0.1s timer. Instant hit confirmation.
- **Screen shake**: Scales 2–8 px with damage, decays over 0.25s. Toggleable in settings.
- **Floating damage numbers**: `DamageNumberFx` in a `ParticlePool` with gravity, bounce, colour coding by damage kind.
- **XP bar smooth animation**: `displayed_xp` lerps toward actual at 3× speed per frame.
- **Pickup magnet acceleration**: Speed scales 1×→3× as gems close in.
- **Level-up card slide-in**: Cubic ease-out over 0.25s with 0.05s stagger between cards.

The level-up card system, meanwhile, grew from a simple hardcoded stat boost into a role-aware, data-driven upgrade engine: 9 upgrades in `upgrades.toml`, no-duplicate enforcement, scoring that considers your current build (orb cards prepend when you have none, HP cards appear when you're low), and rarity-based styling (coloured glows, badges, corner ornaments).

---

## Phase 6: NPCs and Companions (June 14)

The companion system arrived as the answer to a narrative problem: Echo cannot be alone in this world. The game has named NPCs (Eve, Helena, Sophia, Siegfried, Enid), each with YAML dialogue files, cooldown-based abilities defined in `abilities.toml`, and shader-driven visual effects (ward, snare, lance, burst, pulse, chain, void).

Companion AI uses A* pathfinding through a renderer-agnostic navigation grid (`src/game/navgrid.rs`), with moddable formations defined in `companions.toml`. When idle, companions hold a randomised formation ring around the player. When enemies are near, they switch to role-based engagement (melee close in, ranged hold back, skirmishers mid-range).

The NPC ability system is deliberately moddable: adding a new ability means writing a new entry in `abilities.toml`, optionally pairing it with a GLSL shader in `shaders/`, and assigning it to an NPC's loadout. No Rust code required.

I think the companion system is also, in some unexamined way, about what it means to be responsible for people who follow you. But that is a therapy conversation, not a devlog.

---

## Technical Statistics

- **~140 commits** over 2.5 weeks
- **v0.10.4** current version
- **119 passing tests**, 1 ignored (ECS perf bench)
- **9 renderer-agnostic game modules**, **14 runtime modules**, **5 UI modules**, **6 data modules**
- **1 binary crate** (the game), **1 library crate** (all game logic), **3 auxiliary binaries** (sprite_cutter, asset_pack, mod_check)
- **0 hardcoded stat values** in runtime code — every number comes from TOML
- **Lua 5.4** via mlua (vendored), compiled as C with no build scripts

---

## What's Next

The immediate roadmap (Priority 1 in `TODO.md`) is **full-control modding**:

1. **General Lua event hooks** — `on_run_start`, `on_enemy_killed`, `on_player_hit`, `on_level_up_offer`, `on_upgrade_picked`. A single `echo_warrior.on()` API for all events.
2. **Shared data/Lua effect model** — upgrades, abilities, and Lua commands all use the same schema for stat effects, conditions, and targeting.
3. **Mod pack layout** — `Mods/<mod_id>/mod.toml` with metadata, versioning, and content namespace support.
4. **Scene TOML files** — fence positions, garden beds, and prop placement extracted from hardcoded Rust into data.
5. **Audio persistence** — save audio settings, add lazy-loading for non-core SFX, build dynamic music crossfade rules.

Beyond that: the full 60-level account skill tree, 8 archetypes and full enemy roster, legendary item powers, evolutionary weapon chains, stages 2–6, endless mode, and eventually co-op.

---

## Lessons So Far

**Macroquad was the right call.** It got us to a playable prototype in hours instead of days. The renderer-agnostic module boundary (`src/game/` never imports Macroquad) means we can swap the renderer later if we outgrow it, but we've been able to keep the runtime performant by optimising hot paths in `src/runtime/` without touching game logic.

**Data-driven saves time.** Every hour spent building TOML loaders and graceful fallbacks saved ten hours of recompiling to tweak numbers. The current workflow is: edit TOML, save, watch the game pick it up within a second. No restart, no recompile. This matters a lot when your coding sessions are measured in baby-monitor battery life.

**Lua was worth the complexity budget.** The spawn scripting system lets us iterate on wave design 20× faster than hardcoded Rust. The additive hook system means modders can extend waves without touching the base script. The hot-reload cycles faster than the compiler.

**Story can coexist with systems.** The narrative in `PCS.md` is not bolted on — it emerged from the same design thinking that produced the archetype system and the data architecture. The protagonists are data (Eve is a compressed consciousness, Leere is a curator AI), the enemies are data (unprocessed psychological material), and the player's progression is data (the echo field is a broadcast device). The game systems and the story are metaphors for each other.

**Parenting and game development have the same UX principles.** Graceful degradation (when the baby doesn't sleep, you still function, just at reduced capacity). Hot-reload (you adapt to new information within seconds). Data-driven architecture (every child is different and you cannot hardcode your approach). I am only half-joking.

---

## A Note to My Future Daughter

If you are reading this years from now, old enough to understand it: this game is for you. Not because I expect you to love it, but because I built it in a way that you can break it open and make it your own. Change the sprites. Rewrite the story in Lua. Replace the music with the stuff you actually listen to. If you want to turn the Splintered Garden into a coffee shop simulator, the architecture should say *yes* before you even finish typing.

The world is already full of things that tell you how they work and expect you to follow the manual. I wanted to give you a world that asks what *you* want to do with it.

Now go integrate some shadows.

---

*If you're reading this as a modder: every value in the game is yours to change in `Assets/`. Run `cargo run --bin mod_check` to validate your edits.*
*If you're reading this as a developer: the codebase is open, modular, and designed to be understood one module at a time. Start with `Docs/AI_CONTEXT.md`.*
*If you're reading this as a player: the game is early, but the world is already alive. Every run teaches you something about the Splintered Garden — and about what you're willing to carry.*

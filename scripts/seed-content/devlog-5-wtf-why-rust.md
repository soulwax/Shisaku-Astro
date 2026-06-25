---
title: 'Devlog #5 — WTF, Why Rust?'
description: 'Why EchoWarrior is written in Rust instead of C/C++, and what that actually felt like so far.'
pubDate: '2026-06-26T12:00:00.000Z'
status: 'published'
tags:
  - rust
  - architecture
  - modding
  - gamedev
---

**Focus:** Why EchoWarrior is written in Rust instead of C/C++, and what that actually felt like so far.

---

## Why was this game destined to be written in Rust?

A case study against C and C++ as I am an experienced C programmer, a little less experienced C++ programmer, and a Rust beginner.

---

## What Rust is when you just try to ship something

If you only read blog posts, Rust sounds almost mythical because the community is a little deranged: memory safety without a GC, fearless concurrency, modern systems language, all the buzzwords.

None of those slogans were what mattered at midnight, after a hospital shift, staring at a compile error with a baby monitor next to the keyboard.

For EchoWarrior, Rust boiled down to three very practical things:

- A type system that treats shared mutable state like something dangerous and makes you prove you won't shoot yourself in the foot which happens to me on a tuesday with C++ (skill issue).
- A compiler that is annoyingly strict up front, so most of the stupid mistakes show up as red text during `cargo build` instead of as crash logs halfway through a run. They are also very blunt and clear about what is wrong, which is a huge help when you are tired and distracted.
- An ecosystem of crates that handle all the boring parts: TOML and YAML parsing, Lua embedding via `mlua`, serialization with `serde`, logging, asset packing.

So imagine C or C++ with a compiler that yells at you for a specific reason, not because of segfaults, PLUS a package manager that makes it easy to pull in libraries for boring stuff. That is what Rust currently is and it does its job.

Underneath the marketing, Rust assumes the programmer will be tired and distracted and designs the language around that assumption. For a game that is explicitly built to be taken apart and edited by people who are not writing Rust, that attitude turned out to be extremely fucking damn crucial after a dream or two.

---

## The Rust Tax: 12 Seconds vs One Second

Start with the thing Rust is bad at: iteration speed lol.

On this project, a full debug rebuild of the EchoWarrior crate takes around twelve seconds. That is "fast" by Rust standards. It is an eternity when you're trying to tune a spawn curve and your brain keeps leaving the room during each compile.

Early on, every balance tweak meant:

- Change a number in Rust.
- Wait twelve seconds.
- Re-run the game.
- Forget what you were testing.

That pain is what forced the data-driven turn so hard. Enemies, player stats, spawn waves, UI, shaders, companions -- all of it migrated into TOML and YAML specifically so that tuning could happen without waiting for the compiler every time.

In C or C++, compile times can be better, but the temptation is strong to hardcode values in code because it's "just one more constant". Rust's compile-time tax made hardcoding feel bad enough that it pushed everything out into data.

So a very simple rule emerged:

- Rust does the heavy lifting once.
- TOML and Lua do the day-to-day iteration.
- Modders never have to see a recompile at all.

That is Rust in practice: strict up front, then aggressively offloading everything that doesn't need that strictness into data.

---

## The Borrow Checker vs Hot-Reload: Three Evenings and a Teething Baby

Hot-reloading Lua scripts was refreshingly straightforward: recompile the chunk, swap it into the Lua state, let the garbage collector clean up old references. No borrow checker, no lifetime nightmares.

Hot-reloading Rust data into live structs was the opposite.

The problem: when `ui.toml` changes on disk, the game should reload colours, labels, layout numbers, and theme values while the game is running. The catch is that these values are read on every frame. If you naively grab a write lock and swap in new data while the renderer is reading, you get stutters or deadlocks.

Rust will not let you "just wing it" here. It forced a design:

- A "dirty" flag set by the file watcher.
- A generation counter with last-modified times.
- A reload pass at the start of the frame that deserializes new values, swaps them into the config, and logs errors while keeping old values if parsing fails.

Getting this right took three evenings, a lot of thread-sanitizer output, and at least one session where the baby was teething and my brain was mush. But the result is exactly what modders need:

- Edit `ui.toml`.
- Save.
- Watch labels and colours change within one second, even if you temporarily broke the file.

Would C or C++ let you build something similar? Of course. But C and C++ would happily let you build it *wrong* too: raw pointers into structs that get freed, missing locks on paths you thought were "safe", malformed files causing UB instead of logged defaults.

Rust's borrow checker was painful in the moment, but it forced a hot-reload design that matches the philosophy of the game: **people will break things; the system should bend, not snap**.

---

## The Python Plan, Windows AppLocker, and Why Lua Won

Originally, the plan was to embed Python.

The reasoning was simple:

- More people know Python than Lua.
- A lower barrier to scripting should mean more mods.
- Rust has `rustpython-vm`, which sounded perfect on paper.

Reality:

- `rustpython-vm` eventually compiled and worked on Linux.
- On Windows 11, AppLocker stepped in and blocked the build scripts that `rustpython-vm` uses to compile its vendored Python.
- The error code was 4551, which is now permanently burned into memory.

Two days vanished into trying to dodge group policy:

- Disabling AppLocker.
- Swapping Rust toolchains.
- Building without vendored Python.
- Trying different forks.

None of it worked on the primary Windows machine. The conclusion was very simple and very Rust-flavoured: **a scripting language that does not reliably compile on your target platform is useless**.

Lua, via `mlua`, compiled as a C library with no build scripts, no AppLocker drama, and no surprises. It built on the first `cargo build` and has not caused a single build problem since.

Yes, that choice means modders need to learn Lua instead of Python. But Lua is small and focused:

- One table type.
- One string type.
- First-class functions.
- No classes.

You can learn enough Lua to write spawn logic in an afternoon. And more importantly, Lua *builds*. Everywhere. All the time.

Rust didn't just influence the choice of game language; it influenced the choice of scripting language. The same bias shows up again: reliability beats popularity when the whole point is "you are allowed to change this".

---

## The Import Wall: Rust's Architecture Push vs C/C++

One of the most important decisions in EchoWarrior is a line you never see in gameplay: the boundary between `src/game` and `src/runtime`.

- `src/game`: pure logic -- combat, enemies, player, dialogue, ECS, data structures like `Vec2`, `EnemyDef`, `PlayerConfig`. No Macroquad imports. No renderer knowledge.
- `src/runtime`: all the Macroquad bits -- render loop, input, audio, window management.

That separation isn't uniquely Rust. You can absolutely write a renderer-agnostic game core in C or C++. But Rust's module system and type discipline make the clean split feel natural:

- Game code manipulates plain data and enums.
- Runtime layers know how to draw, but never leak framework types back into game logic.

The side-effects are powerful:

- You can unit-test enemy movement without a GPU.
- You can, in principle, swap Macroquad for `wgpu` or something else later without rewriting combat.
- You can expose game state to Lua without dragging in an OpenGL context, because the state is already framework-free.

In C or C++, it's very easy for "just one render call" to slip into core logic, and suddenly your data layer knows about textures and cameras. Rust didn't magically prevent that, but it did make it much clearer where those boundaries should be, and made violations feel obviously wrong.

---

## Data-Driven Design, Graceful Degradation, and Why Rust Helped

By now, EchoWarrior has:

- Nineteen TOML data files under `Assets/Data`.
- A YAML dialogue file for Leere (and more incoming).
- Lua scripts for spawn waves, plus additive layers.
- Around 3,100 lines of data loader code.
- Zero hardcoded gameplay values in `src/game` or `src/runtime`.

Every loader follows the same boring pattern:

- Try to read the file.
- Try to parse it with `serde`.
- If something fails, log a clear error and return a fully defaulted config.

The boringness is intentional. It's "defensive architecture" written for the moment when:

- A modder forgets a comma.
- Or a developer (that would be me) mis-types a field name at 1 AM.

In C, that level of graceful degradation is possible, but never automatic. In Rust, `serde(default)` plus `Default` implementations and `Result` handling make it the path of least resistance.

From a general Rust vs C/C++ perspective, this is one of the real differences:

- C and C++ can be as safe and data-driven as you want, but the language doesn't nudge you there.
- Rust keeps pushing: model your data, specify defaults, handle errors, don't crash.

For a game that is explicitly designed so a non-programmer friend can open `player.toml`, change `movespeed` to 500, and watch the character zoom around without ever seeing a stack trace, that push matters.

---

## So Why Rust, Not C or C++?

There's no single dramatic reason. Instead, it's a stack of small ones that all point the same way:

- Rust made it painful to hardcode things, which forced almost everything into data files that modders can edit.
- Rust's borrow checker made concurrency bugs annoying enough that the hot-reload system ended up defensive and robust instead of "it'll probably be fine".
- Rust's ecosystem (`serde`, `mlua`, TOML/YAML crates) made boring, reliable tooling the default rather than a side project.
- Rust's compilation model turned each panic into a personal insult, so loaders were written to never crash on bad mod data.

Could EchoWarrior have been built in C or C++? Absolutely. It might even compile faster. But it would have been much easier to accidentally build a game that punishes curiosity: one typo in a config, and the whole thing falls over.

Rust helped push every major decision toward the opposite outcome:

- Assume people -- modders, developers, future players -- will make mistakes.
- Make those mistakes cheap.
- Let them try again without feeling like they broke something forbidden.

That, more than any benchmark or slogan, is why this game is written in Rust.

---

## Concrete code examples

```rust
#[derive(Deserialize, Default)]
struct PlayerConfig {
    #[serde(default = "default_movespeed")]
    movespeed: f32,
    #[serde(default)]
    health: u32,
}
```

```rust
fn load_player_config(path: &str) -> PlayerConfig {
    let file = std::fs::File::open(path).unwrap_or_else(|_| {
        log::warn!("Could not open {}, using defaults", path);
        return std::fs::File::open("default_player.toml").unwrap();
    });
    let config: Result<PlayerConfig, _> = toml::from_reader(file);
    match config {
        Ok(cfg) => cfg,
        Err(e) => {
            log::error!("Failed to parse {}, using defaults: {}", path, e);
            PlayerConfig::default()
        }
    }
}
```

Versus:

```cpp
struct PlayerConfig {
    float movespeed = 5.0f;
    unsigned int health = 100;
};

PlayerConfig load_player_config(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        std::cerr << "Could not open " << path << ", using defaults" << std::endl;
        return PlayerConfig(); // default
    }
    PlayerConfig config;
    // Pseudo-code for parsing TOML in C++
    if (!parse_toml(file, config)) {
        std::cerr << "Failed to parse " << path << ", using defaults" << std::endl;
        return PlayerConfig(); // default
    }
    return config;
}
```

Another example why it actually matters: the Lua hot-reload system. In Rust, you can safely swap in new data while the game is running, thanks to the borrow checker and careful design. In C/C++, you might end up with dangling pointers or race conditions if you try to do the same thing without a lot of extra care. Rust's strictness upfront leads to safer, more robust systems in practice, especially in a modding-friendly environment like EchoWarrior.

```rust
fn reload_ui_config() {
    if ui_config_dirty {
        let new_config = load_ui_config("ui.toml");
        let mut config_lock = ui_config.write().unwrap();
        *config_lock = new_config;
        ui_config_dirty = false;
    }
}
```

C/C++ equivalent might look like this, but it's more error-prone:

```cpp
void reload_ui_config() {
    if (ui_config_dirty) {
        PlayerConfig new_config = load_ui_config("ui.toml");
        std::lock_guard<std::mutex> lock(ui_config_mutex);
        ui_config = new_config; // Potentially unsafe if other threads are reading
        ui_config_dirty = false;
    }
}
```

And one with heap allocation:

```rust
fn load_enemy_definitions() -> Vec<EnemyDef> {
    let file = std::fs::File::open("enemies.toml").unwrap();
    let defs: Result<Vec<EnemyDef>, _> = toml::from_reader(file);
    match defs {
        Ok(d) => d,
        Err(e) => {
            log::error!("Failed to parse enemies.toml: {}", e);
            Vec::new() // Return empty vector on error
        }
    }
}
```

```cpp
std::vector<EnemyDef> load_enemy_definitions() {
    std::ifstream file("enemies.toml");
    if (!file.is_open()) {
        std::cerr << "Could not open enemies.toml" << std::endl;
        return std::vector<EnemyDef>(); // Return empty vector
    }
    std::vector<EnemyDef> defs;
    // Pseudo-code for parsing TOML in C++
    if (!parse_toml(file, defs)) {
        std::cerr << "Failed to parse enemies.toml" << std::endl;
        return std::vector<EnemyDef>(); // Return empty vector on error
    }
    return defs;
}
```

Why is the Rust version safer? Because it uses `Result` and `unwrap_or_else` to handle errors with a degree of "grace", while the C++ version relies on manual error checking and can easily lead to undefined behavior if not handled correctly. Again you can always argue skill issue but I just don't remember C++ having a package manager, with all the reasons above. It's safe yes but also a lot of work.

But! We would have to write a lot more code in C++ to get the same level of "safety" and error handling that Rust forces you into. If you are forced to go on a diet and exercise every day, would you call it "stripping freedoms?"

The borrow checker, type system, and ecosystem of crates make it easier to write robust code without having to reinvent the wheel for every little thing.

The ECS system was installed with a crate, the TOML parsing was done with a crate, the Lua embedding was done with a crate, and so on. In C/C++, you would have to either write your own or find a library and deal with linking issues, which is a whole other can of worms.

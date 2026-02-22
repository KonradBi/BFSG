# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Codex CLI (gpt-5.3-codex) — PATH Fix

If `codex exec --model gpt-5.3-codex` fails, check for multiple installations in PATH:

```bash
which -a codex
codex --version
```

Known-good binary on this machine:

```bash
/Users/konrad/.npm-global/bin/codex --version
/Users/konrad/.npm-global/bin/codex exec --model gpt-5.3-codex "Reply with exactly: OK"
```

Permanent fix (zsh): ensure `~/.npm-global/bin` comes first:

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
source ~/.zshrc
hash -r
which codex
codex --version
```

Update if needed:

```bash
npm -g config set prefix ~/.npm-global
npm i -g @openai/codex@latest
```

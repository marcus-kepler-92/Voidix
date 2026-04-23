# Voidix Frontend Strip — Design Spec

**Date:** 2026-04-23
**Branch:** `refactor/voidix-strip-features`
**Scope:** Hide LobeChat features not needed for Voidix (entry-point hiding only; no code deletion)

---

## Goal

Transform the LobeChat fork into a focused AI image/video generation platform by hiding all navigation entries and settings items that are irrelevant to Voidix's MVP. Code is retained in the repo; only UI entry points are suppressed.

---

## Out of Scope

- Brand replacement (logo, colors, fonts) — separate task
- Points system integration — separate task
- China localization (SMS login, WeChat, payment UI) — separate task
- Any backend changes
- Code deletion (deliberately deferred)

---

## Change 1 — `.env` / `FEATURE_FLAGS` (zero code)

Add to `.env`:

```
FEATURE_FLAGS=-market,-knowledge_base,-provider_settings,-openai_api_key,-openai_proxy_url,-speech_to_text,-welcome_suggest,-changelog,-check_updates,+commercial_hide_github,+commercial_hide_docs
```

| Flag                      | Effect                                        |
| ------------------------- | --------------------------------------------- |
| `-market`                 | Hides Community tab from sidebar nav          |
| `-knowledge_base`         | Disables knowledge base feature               |
| `-provider_settings`      | Removes Provider config from settings sidebar |
| `-openai_api_key`         | Hides OpenAI API key field in settings        |
| `-openai_proxy_url`       | Hides OpenAI proxy URL field in settings      |
| `-speech_to_text`         | Removes STT microphone button from chat input |
| `-welcome_suggest`        | Hides welcome suggested questions on home     |
| `-changelog`              | Removes Changelog entry from footer menu      |
| `-check_updates`          | Disables update-check popup                   |
| `+commercial_hide_github` | Hides GitHub link from footer                 |
| `+commercial_hide_docs`   | Hides Docs link from footer/menu              |

Already off by default (no action needed): `agent_task`, `agent_onboarding`, `rag_eval`, `api_key_manage`, `cloud_promotion`.

---

## Change 2 — `src/hooks/useNavLayout.ts`

Add `hidden: true` to three items in `bottomMenuItems`:

- `/page` (Pages / Notes)
- `/memory` (Memory)
- `/resource` (Resource library + plugin store)

These items already use `hidden: !showMarket` as a pattern — same mechanism, no new abstraction needed.

---

## Change 3 — `src/routes/(main)/home/_layout/Body/index.tsx`

Hide the Agent chat list from the home sidebar. One required change, one optional cleanup:

1. **Required:** Remove `GroupKey.Agent` from `ACCORDION_KEYS` (line \~30). This stops the `<Agent>` accordion component from rendering. Without this key, the render loop falls through to `renderNavLink('agent')`, which returns `null` because `agent` is not in `topNavItems` or `bottomMenuItems` — so nothing is rendered.
2. **Optional cleanup:** Remove `k === GroupKey.Agent` from the `isVisible` callback (line \~82). This hardcoded condition forces `agent` to always be in `visibleKeys`, but since step 1 already ensures it renders nothing, this is cosmetic only.

---

## Change 4 — `src/routes/(main)/settings/hooks/useCategory.tsx`

Remove five items from the settings sidebar:

| Item           | Group   | Reason                                              |
| -------------- | ------- | --------------------------------------------------- |
| `ServiceModel` | Agent   | Users cannot select models; New API handles routing |
| `Skill`        | Agent   | LobeChat skill store — not part of Voidix           |
| `Memory`       | Agent   | Memory feature not in MVP                           |
| `Creds`        | Agent   | Credential management not exposed to end users      |
| `Stats`        | General | LobeChat usage statistics — not Voidix credit stats |

Items to keep: Profile, Appearance, Hotkey, Storage, Advanced, About, Security.

---

## Risk Assessment

| Change                      | Difficulty | Risk                                 |
| --------------------------- | ---------- | ------------------------------------ |
| `.env` flags                | Trivial    | None                                 |
| `useNavLayout` hidden flags | Trivial    | None                                 |
| `Body/index` Agent removal  | Easy       | Low — two spots must both be changed |
| `useCategory` item removal  | Trivial    | None                                 |

No changes require a rebuild of any abstraction. All changes are reversible by undoing the flag/line.

---

## Verification Checklist

After implementation, confirm visually:

- [ ] Community tab absent from sidebar
- [ ] Pages, Memory, Resource nav entries absent
- [ ] Agent chat list absent from home sidebar
- [ ] `/agent` route inaccessible via any visible UI entry
- [ ] Settings sidebar shows only: Profile, Appearance, Hotkey, Storage, Advanced, About, Security
- [ ] Footer has no GitHub, Docs, Changelog entries
- [ ] Chat input has no STT microphone button
- [ ] Image generation (`/create/image`) and video generation (`/create/video`) remain fully functional

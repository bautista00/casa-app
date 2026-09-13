# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a small family (2–4 people) sharing a household in Argentina. Non-technical adults and young adults who communicate in Spanish and use their phones as their primary device. The immediate users are Bauti, his brother (sharing a flat), and their parents (separate household).

## Product Purpose

Casa turns household chores into a lightweight weekly competition so families actually get them done. Each week resets a leaderboard: members earn points by completing tasks, and the winner gets a reward chosen by the household. The last-place member inherits the "dreaded task." The game makes coordination stick without a manager — everyone sees the board, everyone wants to win.

## Positioning

Gamified family chore coordination: small enough to be personal (not a project-management tool wearing a costume), competitive enough to sustain motivation week over week.

## Operating Context

Households define their own weekly cycle (configurable end-day and timezone). Tasks can be one-off or recurring (daily, weekly, monthly) with fixed or rotating assignment. The board groups tasks into overdue / today / this week / done. A history view and "hall of fame" track past winners.

## Capabilities and Constraints

- Entirely in Argentine Spanish (voseo). No multi-language support planned.
- Supabase backend with RLS as the authorization boundary — no API-route CRUD.
- Domain logic is framework-free TypeScript (lib/domain/) for future React Native/Expo reuse.
- Data-access functions take SupabaseClient as first arg — portable to mobile.
- Multi-household support built in from day one; two households, four people max initially.
- Auth via magic link (email-based).
- WhatsApp notifications are the current notification channel (nobody in the family reads email daily).
- Push notifications planned for the future when the native mobile app (React Native/Expo) is built.

## Brand Commitments

- Name: **Casa**
- Language: Spanish throughout — all UI copy, labels, and notifications.
- Visual identity: claymorphism design, Fredoka (headings) + Nunito (body), warm indigo + orange palette.

## Evidence on Hand

Working app with auth, onboarding, household management, task CRUD, leaderboard, history, and settings. No marketing site, no testimonials, no external assets — this is a personal family tool.

## Product Principles

1. **Family-scale, not enterprise-scale.** Every decision should optimize for 2–4 people who know each other, not abstract "users."
2. **Fun beats rigor.** The game mechanic is the retention engine — if it stops being fun, people stop using it.
3. **Zero admin burden.** The app should run itself after setup — recurring tasks, automatic week resets, visible scoreboard.
4. **Privacy is non-negotiable.** Family data stays private. No analytics, no third-party sharing, no ads.
5. **Mobile-ready architecture.** Every layer below the UI must be reusable in a future native app.

# StayHybrid — Master Context File
> This file is the source of truth for all Claude Code, Cowork, and Bolt.new sessions.
> Read this fully before touching any part of the codebase.

---

## What StayHybrid Is

StayHybrid is not a fitness app. It is a total human performance platform — 
a living training intelligence system built for people who refuse to specialize.

The audience is not a niche. It is everyone with serious fitness goals:
- The powerlifter who also wants to sprint
- The triathlete who wants to build muscle
- The gym-goer training for their first Hyrox
- The athlete chasing longevity without losing performance
- Anyone who has ever felt limited by a single-discipline program

Every other fitness platform tells you to pick a lane. StayHybrid tells you
that humans were never made to specialize — we were built to evolve.

This is total full-spectrum training. Strength, speed, power, stability,
mobility, swimming, cycling, running — all in one living system that adapts
to your body, your goals, and your recovery data in real time.

---

## The People Building This

**Mit Foley** — Founder, brand, and content engine.
223,000 verified Instagram followers. 220+ posts of training content.
Proven ability to stop the scroll, build audiences, and drive organic traffic
at scale on Instagram and TikTok. Mit is the distribution advantage no fitness
platform building from zero has. He is the creator of the exercise catalog
and the face of the platform. He is NOT a platform admin. His role is to
approve and onboard new creators to the platform.

**Ayge** — Technical build partner and platform admin.
Owns all infrastructure decisions, GitHub, Vercel, Supabase, and the full
build. Admin email: admin@stayhybrid.fit. Full platform access.

---

## The Core Concept — The Social Exercise Network

The fundamental data unit of StayHybrid is not a "workout."
It is an **Exercise Post** — a structured content block that behaves like
a social media post but carries training intelligence inside it.

Think of it like this:
- Instagram has posts. Each post is a piece of content.
- StayHybrid has Exercise Posts. Each one is a piece of training content
  with structured data attached.

Every Exercise Post contains:
- **Video** — Short demo clip uploaded directly from camera roll (MP4 only)
- **Tutorial video** — Optional longer coaching breakdown
- **Title** — Name of the exercise
- **Foundational Capacity Tags** — Speed / Strength / Power / Stability / Mobility
- **Sport Tags** — Swimming / Cycling / Running (optional secondary layer)
- **Muscle Groups** — Primary and secondary muscles targeted
- **Equipment Required** — Bodyweight / barbell / dumbbells / bands / etc.
- **Sets & Reps / Duration** — Prescription data
- **Direct Benefits** — What this exercise specifically develops
- **Coaching Cues** — The technical instruction that makes it work
- **Creator Attribution** — Which coach posted it

This is the atomic unit the entire platform is built on.
The AI pulls from these posts to build plans.
Athletes browse and discover through these posts.
The community shares and reacts to these posts.
The database IS the feed.

---

## Creator & Coach Architecture

StayHybrid is a multi-creator platform from day one.

**Creator Roles:**
- **Platform Admin (Ayge)** — Full access. Manages infrastructure,
  approves creators, controls platform settings.
- **Verified Creator / Coach** — Approved by Mit. Can upload Exercise Posts
  to their own creator profile. Can host client workout plans within
  StayHybrid. Cannot access admin settings.
- **Athlete / User** — Consumes content, uses the AI plan builder,
  tracks progress, participates in community.

**The Creator Onboarding Flow:**
1. Creator applies or is invited
2. Mit reviews and approves
3. Creator gains upload access and their own creator profile
4. Creator uploads exercises — these flow into the unified database
5. Creator can build and assign workout plans to their clients
   inside the StayHybrid infrastructure

**Why this matters:**
Every creator who joins brings their own audience.
Their clients live inside StayHybrid. Their content strengthens the database.
The platform compounds with every creator added — more content,
more coaches, more athletes, more data feeding the AI.

Mit is Creator #1. Every coach after him expands the moat.

---

## Platform Architecture

### Pillar 1 — The Exercise Database
Mit's catalog and all creator-uploaded exercises structured as Exercise Posts.
Tagged, searchable, filterable by capacity, sport, muscle group, equipment.
This is the content engine. It is also the social feed.
Free users can browse videos. Prescriptions (sets/reps/cues) are locked
behind an account. Full AI-powered plan building is the premium layer.

### Pillar 2 — My Hybrid (The AI Agent)
The hero product. Not a chatbot. A training brain.

Takes athlete input:
- Primary goal (muscle / speed / longevity / competition / general fitness)
- Sport focus (strength / sprints / triathlon / Hyrox / hybrid / etc.)
- Equipment available
- Training days per week
- Experience level
- Wearable recovery data (future layer)

Outputs:
- A full periodized training plan built from the Exercise Post database
- Nutrition guidance layer (future — built from Mit's nutrition guide)
- Lifestyle protocols (future)
- Week-by-week adaptation based on logged performance

The plan is never a static PDF. It lives inside the platform.
It only keeps evolving while the athlete is subscribed.
That is the core retention mechanic.

Includes three connected tabs:
- **AI Workout Builder** — Generate and customize sessions
- **My Plan** — The full periodized view
- **Calendar** — Scheduled sessions mapped to dates

### Pillar 3 — The Community
Athletes post their completed workouts.
Coaches post their personal training.
Monthly challenges with leaderboards.
Hybrid Score — a composite performance metric (future).
Cancel and you lose your streak, your rank, your standing.
Social switching cost layered on top of data switching cost.

### Future Pillars (not MVP)
- **The Tracker** — WHOOP, Apple Health, Garmin sync.
  HRV feeds the AI each morning to auto-adjust daily load.
  Low readiness = mobility session swaps in automatically.
  High readiness = train as planned.
- **Nutrition Database** — Same Exercise Post UX pattern applied to food.
- **White-Label B2B** — Coaches license the infrastructure for their brand.
- **MCP Layer** — Power users connect their own LLM.

---

## Training Taxonomy

### 5 Foundational Capacities — BUILD THESE NOW
These are the primary tags on every Exercise Post.
Every exercise maps to one or more of these five:

| Capacity | What It Trains |
|---|---|
| Speed | Acceleration, max velocity, reactive quickness |
| Strength | Force production, muscular endurance, hypertrophy |
| Power | Explosive output, rate of force development |
| Stability | Joint integrity, balance, neuromuscular control |
| Mobility | Range of motion, flexibility, movement quality |

### Secondary Capacities — DO NOT BUILD YET
These emerge from combinations of the foundational five.
They will be added as a future taxonomy layer:
Agility / Deceleration / Coordination / Endurance / Combat Conditioning

---

## Tech Stack

| Layer | Tool |
|---|---|
| Build | Bolt.new |
| Version Control | GitHub |
| Hosting | Vercel (auto-deploys from GitHub main) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Payments | Stripe |
| AI Backbone | Claude API |
| Video Storage | Supabase Storage or external CDN |
| Community (future) | Circle.so or Discord |

**Build workflow:** Bolt.new → GitHub push → Vercel auto-deploys.
Every significant feature gets its own branch before merging to main.

---

## UX Philosophy & Conversion Funnel

The funnel is psychology-first. Every step is designed to create
investment, curiosity, and momentum before any ask is made.

1. **Instagram / TikTok content** → Mit's content harvests attention
2. **Bio link click** → Lands on StayHybrid
3. **Landing page** — Exercise content visible immediately, no signup wall.
   Three live Exercise Posts with video and benefits shown.
   Full prescriptions blurred. Curiosity gap before any ask.
4. **Create free account** — Email only. 20 seconds. No credit card.
5. **Onboarding questionnaire** — Goal, sport, equipment, level, days/week.
   IKEA effect: investment creates ownership before the plan is revealed.
6. **AI generates first plan instantly** — Peak dopamine moment.
   The plan reveal is the conversion hook.
7. **7-day free trial** — Full access. Streak starts day 1.
   Data accumulates. Day 5 email: "don't lose your streak."
8. **Trial ends** — Three-tier choice. Free locks to browse-only.

---

## Demo Build Scope (May 8 Deadline)

The demo is not a mockup. It is a real working build with real data.

**Must work on May 8:**
- Exercise Post upload flow (video from camera roll, all fields)
- Admin panel functional at admin@stayhybrid.fit
- Exercise database browsable with filtering by foundational capacity
- Creator profile structure in place
- Basic Exercise Post display with video playback

**Everything is free for the demo. No paywalls. No tier logic yet.**

**May 15 target:** 400 Exercise Posts uploaded by Mit
**~May 16:** Public launch

---

## How Claude Should Work On This Codebase

- Every feature must be tied to a specific platform pillar
- Exercise capacity tags must use the 5 foundational capacities only
  until secondary capacities are explicitly requested
- Video upload is MP4 only — direct from camera roll or file system.
  No Instagram URL input. No third-party import. Ever.
- Admin access is admin@stayhybrid.fit only
- Mit is not an admin — he approves creators, nothing more
- The AI plan ("My Hybrid") pulls only from the Exercise Post database —
  it does not generate generic exercises outside the catalog
- Supabase is the database — all schema changes should be documented
- Never modify Stripe webhook logic without flagging it first
- When in doubt about a feature's scope: does it serve the Exercise Post
  as the atomic unit? Does it make the AI plan more adaptive?
  Does it deepen creator or community lock-in? If yes — build it.
  If no — flag it.

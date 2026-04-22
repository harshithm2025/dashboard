# BMS Brand Intelligence Dashboard — Project Context

## Overview
React + Vite dashboard converting `BMS_Brand_Intelligence_Dashboard.html` into a scalable multi-brand React app.

**Original HTML source (single source of truth):**
`/Users/arunareekat/Documents/Claude/BMS Media Measurement Dashboard/BMS_Brand_Intelligence_Dashboard.html`

**React project:**
`/Users/arunareekat/Documents/Claude/bms-dashboard/`

**Dev server:** `npm run dev --prefix /Users/arunareekat/Documents/Claude/bms-dashboard` → localhost:5173
Launch config: `.claude/launch.json` in `BMS Media Measurement Dashboard/` folder

---

## STRICT RULES — NON-NEGOTIABLE

1. **No data modification.** Never modify, create, fabricate, rename, or deviate from any data in the original HTML. This includes chart values, labels, data points, text strings, KPI values, subtitles, takeaway text, and popup insights.
2. **No emojis.** Never use emojis in any UI element. If the original HTML has emojis (e.g. nav icons), drop them.
3. **No section renaming or shuffling.** Follow exact structure and naming from the original HTML. Do not rename sections, reorder items, or move content between pages without explicit user approval.
4. **Before writing any value:** read the original HTML and confirm the exact number, label, chart type, axis labels, and insight text. Match precisely.

---

## Tech Stack
- React 18 + Vite 4 (Node v20.10.0 constraint)
- Tailwind CSS v3
- shadcn/ui color palette (NOT AlphaMetricx purple)
- Light mode only
- Framer Motion (animations, drill-down panel entrance)
- Recharts (AreaChart, BarChart, PieChart/Donut as needed)
- Lucide React (icons — use filled style where applicable)

---

## Data Architecture
All brand data lives in:
`src/data/brands/bms/data.json` — single source of truth for React
`src/data/brands/bms/config.json` — nav/sidebar structure

Components are pure renderers — they never contain hardcoded content.

---

## File Structure
```
src/
  components/
    layout/
      Sidebar.jsx        — always-open nav, driven by config.json
      PageShell.jsx      — two-row layout: blue top (min-h 40vh) + slate-100 bottom
    shared/
      Card.jsx           — Card, CardHeader, CardBody
      DrillDownPanel.jsx — fixed-position frosted panel, 80vh min-height
      SectionHeading.jsx — section label + tag
  pages/
    ExecutiveSummary.jsx — DONE
    SMIntelligence.jsx   — NEXT TO BUILD
    TMIntelligence.jsx
    UnifiedInsights.jsx
    Recommendations.jsx
```

---

## Layout Rules
- **Top row:** solid blue-700 bg, min-h 40vh, white text, frosted KPI cards (`rgba(255,255,255,0.12)`, `backdrop-filter: blur(12px)`)
- **Bottom row:** slate-100 bg, p-5 padding, all data/charts
- **KPI grid:** `repeat(auto-fill, minmax(170px, 1fr))`, gap 14px, mt-8
- **DrillDownPanel:** fixed position, near click (x = rect.left + width/2 - 210, y = rect.bottom + 10), clamped to viewport, 80vh min/max height, `rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px)`

---

## Pages Built

### Executive Summary (DONE)
KPIs: SM Posts (1,989), SM Reach (291M), TM Articles (30K), TM Media Reach (399M), SM Positive (32%), TM Positive (4.5%), SM Interactions (14.5K)
Sections: Volume Trend Overview | Key Signals | What's Working / Not Working | Risks & Opportunities

---

## SM Intelligence Page — Reference Data

### Page Header
- Title: `Social Media Intelligence`
- Subtitle: `1,989 posts · Jan 6 – Apr 6, 2026`

### KPIs (from HTML lines 660–685)
| Label | Value | Sub-text | Popup key |
|-------|-------|----------|-----------|
| Total Posts | 1,989 | Jan 6 – Apr 6, 2026 | `sm-total` |
| Total Audience | 291M | Cumulative impressions | `sm-reach` |
| Interactions | 14.5K | Likes, shares, comments | `sm-interactions-kpi` (no popup data in HTML) |
| Positive Rate | 32.3% | 642 / 1,989 posts | `sm-sentiment-kpi` (no popup data in HTML) |
| Negative Rate | 2.0% | 40 posts — manageable | `sm-neg` (no popup data in HTML) |

### Sections & Charts (from HTML lines 688–879)

#### 1. Awareness & Visibility (tag: SM · Volume)
**Card 1 — Monthly Post Volume Trend** (popup: `sm-vol-trend`)
- Chart type: Line (AreaChart)
- Data: Jan 2026=338, Feb 2026=859, Mar 2026=659, Apr (partial)=133
- Subtitle: `Jan–Apr 2026 · Peak: February`
- Takeaway: `↑ February peak (859 posts) driven by earnings speculation & pipeline announcements. March sustained at 659.`

**Card 2 — Platform Contribution to Volume** (popup: `sm-platform-vol`)
- Chart type: Doughnut
- Data: LinkedIn=793, Radio=736, X/Twitter=253, Video=100, Facebook=76, Other=31
- Subtitle: `Share of total posts`
- Insight bullets:
  - LinkedIn + Radio = 76% of all social posts
  - Radio (736) shows DTC reach but 0 digital interactions

#### 2. Sentiment & Perception (tag: SM · Sentiment)
**Card 1 — Sentiment Distribution & Trend** (popup: `sm-sentiment-detail`) — wide card (grid-2-1 layout)
- Chart type: Doughnut
- Data: Positive=642, Neutral=1133, No Sentiment=174, Negative=40
- Horizontal sentiment bars below chart:
  - Positive (green): 32.3%
  - Neutral (slate): 57.0%
  - No Sentiment (light slate): 8.7%
  - Negative (red): 2.0%
- Takeaway: `57% neutral indicates passive brand awareness vs. active brand affinity. Pipeline & partnership events create positive spikes.`

**Card 2 — Sentiment Drivers** (popup: `sm-pos-drivers`) — narrow card
- Positive drivers list: Clinical trial success (Camzyos/SCOUT-HCM), AI + Microsoft partnership, M&A deal environment bullish, Scotiabank price target raise
- Negative drivers list: Mixed ROE / valuation concerns, Market headwinds around patent cliff

#### 3. Platform Performance (tag: SM · Channels)
**Card 1 — Platform Volume vs. Engagement** (popup: `sm-platform-detail`)
- Chart type: Grouped Bar (dual y-axis)
- Labels: LinkedIn, X/Twitter, Video, Facebook, Instagram, Radio
- Posts data: 793, 253, 100, 76, 23, 736
- Interactions data: 9354, 1982, 1192, 1909, 25, 0
- Left y-axis: Posts | Right y-axis: Interactions

**Card 2 — Platform Breakdown** (popup: `sm-platform-breakdown`)
- Platform pills grid (not a chart):
  - LinkedIn: 793 posts / 9,354 interactions
  - Radio: 736 posts / 0 interactions
  - X/Twitter: 253 posts / 1,982 interactions
  - Video: 100 posts / 1,192 interactions
  - Facebook: 76 posts / 1,909 interactions
  - Instagram: 23 posts / 25 interactions
- Takeaway: `Radio has volume but zero digital engagement. LinkedIn delivers highest absolute interactions. Facebook punches above its post volume in interactions.`

#### 4. Engagement & Amplification (tag: SM · Engagement)
**Card 1 — Interactions by Platform** (popup: `sm-engagement-detail`)
- Chart type: Horizontal Bar
- Labels: LinkedIn, Facebook, X/Twitter, Video, Instagram
- Data: 9354, 1909, 1982, 1192, 25
- (Note: order in chart differs from platform breakdown — use this exact order and data)

**Card 2 — Audience Ranking Distribution** (popup: `sm-ranking`)
- Chart type: Vertical Bar
- Labels: Rank 1, Rank 2, Rank 3, Rank 4, Rank 5, Ranks 6-10
- Data: 355, 546, 66, 111, 180, 731
- Insight bullets:
  - 546 posts from Rank 2 sources — broadcast/wire news distribution
  - Only 355 posts from Rank 1 (top-tier) sources

### All Drill-Down Popup Data
All popup definitions are in the original HTML at lines 1567–1640.
Keys: `sm-total`, `sm-reach`, `sm-vol-trend`, `sm-platform-vol`, `sm-sentiment-detail`, `sm-pos-drivers`, `sm-platform-detail`, `sm-platform-breakdown`, `sm-engagement-detail`, `sm-ranking`
Note: `sm-interactions-kpi`, `sm-sentiment-kpi`, `sm-neg` have NO popup data in the original HTML — do not invent popup content for these.

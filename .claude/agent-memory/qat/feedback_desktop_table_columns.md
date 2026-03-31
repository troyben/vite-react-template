---
name: Desktop table column width budget
description: Column min-widths in the QuotationForm desktop table must stay within the available viewport width at the md breakpoint
type: feedback
---

The desktop line-items table has 8 columns. At the `md` breakpoint (768px viewport) the page padding is `p-4 md:p-6`, giving approximately 720px of usable width.

Current column budget (must sum to <= 720px):
- `#` w-10 = 40px
- Sketch min-w-[100px] = 100px
- Item min-w-[180px] = 180px  ← was 200px, reduced to prevent overflow
- Qty w-16 = 64px
- Rate w-24 = 96px
- Price w-24 = 96px
- Total w-24 = 96px
- Remove w-10 = 40px
- Total: 712px (safe margin: ~8px)

**Why:** At 200px the Item column pushed the total to 732px — 12px over the 720px available at exactly the md breakpoint, causing a horizontal scroll or column clipping at that viewport width.

**How to apply:** Whenever a column's min/fixed width is added or changed, sum all 8 columns and verify the total stays under 720px.

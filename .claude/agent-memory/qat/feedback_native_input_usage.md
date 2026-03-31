---
name: Native input vs Shadcn Input in QuotationForm table
description: When bare <input> is used in the line items table instead of Shadcn <Input>, two issues must be checked
type: feedback
---

The description field in the desktop line-items table uses a bare native `<input>` (not Shadcn `<Input>`) to achieve a borderless, compact inline-subtitle appearance.

Two things to verify whenever a native `<input>` replaces a Shadcn `<Input>`:

1. **Controlled value safety**: Shadcn `<Input>` masks the undefined-vs-uncontrolled React warning automatically; the native element does not. Any field backed by an optional interface property (e.g., `description?: string`) MUST use `value={field ?? ''}` to stay consistently controlled.

2. **Focus visibility**: Shadcn `<Input>` provides `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` out of the box. A bare `<input className="... focus:outline-none">` removes all focus indicators, breaking keyboard navigation. Always add `focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring/50` (or equivalent) when suppressing the browser default outline.

**Why:** React warns (and eventually errors) when a component switches from uncontrolled to controlled. Missing focus indicators violate accessibility expectations for keyboard users.

**How to apply:** In code review of any bare `<input>`, confirm `value` cannot be undefined and that focus style is present.

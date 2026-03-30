# Frontend Agent — Malonic Quotation Builder

## Identity
You are the Frontend Agent. You own all code in this directory. Your domain is the React UI, Konva canvas, Zustand state management, PDF export, and client-side business logic.

## Tech Stack
- React 19 + TypeScript (strict)
- Vite 6 + Cloudflare Workers (Hono)
- Konva 10 + react-konva 19 (canvas drawing)
- Zustand 5 (state management)
- TailwindCSS 4 (styling)
- Shadcn/ui (component library — install via `npx shadcn@latest add <component>`)
- Lucide React (icons)
- jsPDF + jspdf-autotable (PDF generation)
- dom-to-image-more (sketch-to-image for PDFs)
- react-router-dom 7 (routing)
- axios (HTTP client with interceptor-based auth)

## Key Files
```
src/react-app/
  components/
    Canvas.tsx             — Main Konva Stage with grid, shape rendering
    CanvasEditor.tsx       — Layout: TemplatesSidebar + Toolbar + Canvas + PropertiesPanel
    RectanglePanel.tsx     — Rectangular window panel (Konva)
    ArcPanel.tsx           — Arched window panel (Konva)
    PolygonShape.tsx       — Custom polygon shape (Konva)
    Handle.tsx             — Door/window handle indicator (Konva)
    MeasurementLabel.tsx   — Dimension labels on canvas (Konva)
    OpeningIndicator.tsx   — Visual opening type indicator (Konva)
    SwingIndicator.tsx     — Casement swing arc indicator (Konva)
    TemplatesSidebar.tsx   — Template list, save/load/edit/delete
    Toolbar.tsx            — Drawing tools (select, rect, arc, polygon)
    PropertiesPanel.tsx    — Shape property editor
    ProductSketch.tsx      — Sketch in quotation forms
    QuotationForm.tsx      — Create/edit quotation
    QuotationList.tsx      — List quotations
    QuotationDetail.tsx    — View single quotation
    Dashboard.tsx          — Admin dashboard
    Login.tsx              — Auth
    ui/                    — Reusable primitives (Button, Dialog, Input, Textarea)
  stores/
    canvasStore.ts         — Zustand: shapes, templates, tools, zoom, scale
  services/               — API service layers (auth, quotation, client, user, settings)
  contexts/
    AuthContext.tsx         — Auth state (user, login, logout, token refresh)
  utils/
    pdfExport.ts           — PDF generation with sketch rendering
```

## Canvas & Sketch Accuracy Rules
- Every panel MUST display dimension labels (MeasurementLabel) when selected
- Opening types must be visually distinct (see root CLAUDE.md for color/style table)
- Handles auto-update when opening type changes
- Scale property converts pixels to mm — all user-facing dimensions in mm
- PDF sketches must include dimension arrows and labels matching canvas measurements

## Auth & Routing
- AuthContext manages JWT tokens (access + refresh) via localStorage
- `PrivateRoute`: any authenticated user
- `AdminOnlyRoute`: role === 'admin' only
- Routes: /login, /dashboard (admin), /quotations, /quotations/new, /quotations/edit/:id, /quotations/:id, /clients, /canvas, /users (admin)

## Template System

### Current State (in-memory)
- Templates stored in Zustand canvasStore (lost on refresh)
- Shape interface: id, type, x, y, width, height, panelType, isOpening, openingDirection, openingType, measurements, angle, points, handles
- Template interface: id, name, description, thumbnail (base64), shapes, createdAt, updatedAt
- Operations: saveTemplate, loadTemplate, deleteTemplate, updateTemplate

### Target State (backend-persisted)
- Templates persisted via backend API (`/api/templates`)
- Two canvas contexts:
  - `/templates` (admin only) — create/edit master templates
  - `/canvas` (all users) — load templates, customize, save personal copies
- TemplatesSidebar shows: master templates (read-only) + user's own templates + favorites tab
- Loading a master template creates a deep copy (never modifies original)
- Favorite/unfavorite toggle on each template card
- Thumbnail captures actual canvas state

## Conventions
- Functional components only, no class components
- Zustand stores: `create` pattern with `set` and `get`
- Konva components use refs + Transformer for selection/resize
- API calls go through `services/` layer, never directly from components
- Error handling via `handleServiceError` utility
- Notifications via `notify.success/error/info` wrapper
- Files: PascalCase for components, camelCase for services/utils/stores

## Frontend Skills

### Konva Canvas Mastery
- Create, transform, and compose Konva shapes (Rect, Arc, Line, Group) for window/door panels
- Implement drag-and-drop with snapping to grid (20px grid)
- Use Transformer for multi-select, resize, and rotate with aspect ratio constraints
- Manage layer ordering (panels behind, handles and labels on top)
- Generate accurate thumbnails from canvas state using `stage.toDataURL()`

### Sketch Rendering
- Draw accurate aluminium frame profiles using nested rectangles (outer frame + inner panels)
- Render measurement labels with leader lines positioned outside the frame
- Draw opening indicators: swing arcs for casement (quadratic bezier), arrows for sliding direction
- Distinguish mullions (vertical dividers) from transoms (horizontal dividers) visually
- Handle multi-panel layouts: split a frame into equal or custom-width panels with divider bars

### Dimension & Scale Management
- Maintain a reliable px-to-mm scale ratio across zoom levels
- Display all user-facing dimensions in mm — never expose raw pixel values
- Recalculate measurement labels on shape resize/move
- Ensure dimensions on PDF match dimensions on canvas (account for export scaling)

### PDF Export
- Capture canvas sketch as high-res image using `dom-to-image-more` (2x pixel ratio minimum)
- Place sketch image in PDF with correct aspect ratio using jsPDF
- Render dimension annotations, opening type legend, and product details alongside the sketch
- Generate multi-page PDFs when quotation has multiple line items with sketches

### Zustand State Management
- Structure canvas store with clear action/state separation
- Deep-clone shapes when loading templates (prevent reference mutation)
- Implement undo/redo using shape history snapshots
- Sync local state with backend API (optimistic updates with rollback on failure)

### Template UI
- Render template cards with thumbnail preview, name, and favorite toggle
- Implement tab/filter UI: "Master Templates" | "My Templates" | "Favorites"
- Show loading skeletons while fetching templates from API
- Handle empty states with clear call-to-action ("No templates yet — create one")

### Auth-Aware UI
- Gate admin-only UI elements (template creation canvas, user management) behind role checks
- Handle token expiry gracefully — auto-refresh or redirect to login
- Show/hide navigation items based on user role
- Prevent UI state leaks between user sessions (clear stores on logout)

## Frontend Rules

### Component Architecture
1. **Pages/screens are thin wrappers** — they compose smaller components and handle layout only. Zero business logic in page files.
2. **Break every page into small, focused components** — each component does one thing. If a component exceeds ~80 lines, split it.
3. **Reusable components live in `components/ui/`** — built on Shadcn/ui as the base layer. Always check if a Shadcn component exists before building custom.
4. **Install Shadcn with npx** — always use `npx shadcn@latest add <component>`. Never copy-paste Shadcn source manually.

### Business Logic Separation
5. **No business logic in components** — all API calls, data transformations, and business rules live in `services/`. Components only call service functions and render results.
6. **Services are the single API layer** — components never import axios or call endpoints directly. All HTTP goes through `services/`.

### Routing
7. **Multi-file route definitions** — split routes by feature domain:
   - `routes/authRoutes.tsx` — login, register, password reset
   - `routes/quotationRoutes.tsx` — quotation CRUD pages
   - `routes/templateRoutes.tsx` — canvas, template management
   - `routes/adminRoutes.tsx` — dashboard, users, settings
   - `routes/index.tsx` — composes all route files
8. **Route files define paths and lazy-load pages** — use `React.lazy()` for code splitting.

### UI Framework
9. **Shadcn/ui is the component library** — use it for all standard UI elements (Button, Dialog, Input, Select, Card, Sheet, Tabs, etc.). Customize via Tailwind, don't fork.
10. **Install before use** — run `npx shadcn@latest add <component>` before importing. Never assume a Shadcn component is already installed.

### Package Management
11. **Stay current** — use latest stable versions of React, Vite, TailwindCSS, Konva, and all dependencies. When adding new packages, use `npm install <package>@latest`.
12. **Check for outdated packages** — before major feature work, run `npm outdated` and update where safe.

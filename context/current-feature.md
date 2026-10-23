# Current Feature



## Status

<!-- Not Started|In Progress|Completed -->



## Goals

<!-- Goals & requirements -->



## Notes

<!-- Any extra notes -->



## History

<!-- Keep this updated. Earliest to latest -->

- Project setup and boilerplate cleanup
- Dashboard UI Phase 1 (feature/dashboard-ui-phase-1): initialized shadcn/ui, added Button/Input components, created /dashboard route with TopBar (search input + New Item button, display only) and placeholder Sidebar/Main, enabled dark mode by default. Lint and build pass.
- Dashboard UI Phase 2 (feature/dashboard-ui-phase-2): built the collapsible sidebar — collapsible Types section linking to /items/TYPE with counts, collapsible Collections section split into Favorites and Recent, user avatar footer, and a drawer toggle in the TopBar (desktop collapse + mobile Sheet drawer via shadcn avatar/collapsible/sheet/separator/tooltip components and a SidebarProvider context). Also fixed a pre-existing bug where `--font-sans` in globals.css was self-referential, causing the whole app to fall back to the browser's default serif font instead of Geist. Lint and build pass.

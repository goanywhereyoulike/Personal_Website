# Portfolio Design System

## Typography color policy

Text color is assigned by information function, never by font size. A large heading and a small label may use different colors because of their roles, not their dimensions.

| Role | CSS token | Value | Use |
| --- | --- | --- | --- |
| Primary | `--text-primary` | `#ECE9E1` | Name, page and section headings, project titles, role titles, capability titles, primary contact statement |
| Secondary | `--text-secondary` | `#96928A` | Introductions, descriptions, body copy, inactive navigation, supporting text |
| Tertiary | `--text-tertiary` | `rgba(150, 146, 138, 0.62)` | Dates, locations, metadata, copyright, low-priority supporting labels |
| Accent | `--text-accent` | `#C8A46B` | FZ brand mark, section identifiers, institution or company names, project indices, active emphasis and small interaction details |
| Inverse | `--text-inverse` | `#10100F` | Text placed on ivory or gold filled controls only |

### Application rules

- Ivory is the default for core information and headings.
- Warm grey carries readable supporting content and full sentences.
- Tertiary grey is reserved for metadata and must not carry essential information.
- Gold is an accent, limited to roughly 5–8% of visible text. Do not use it for paragraphs or complete descriptive sentences.
- Navigation remains warm grey when inactive and uses an ivory pill with inverse text when active.
- New components must use the semantic CSS tokens above; do not add hard-coded text colors.
- If a requested manual text-color change conflicts with these roles, explain the conflict and ask for confirmation before changing it. Never silently override the policy.

## Current page mapping

- Hero name: Primary
- Hero description: Secondary
- FZ brand mark: Accent
- Section headings, experience titles, project titles, capability titles and contact heading: Primary
- Section identifiers, institution/company names and project numbers: Accent
- Descriptions and supporting copy: Secondary
- Dates, locations and footer metadata: Tertiary

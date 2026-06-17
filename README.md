# SocratISA

Een Socratische AI uitleg en generatie webapplicatie gebouwd voor het ISA Lab van NHL Stenden. 

Gebruikers lezen over wat AI is, hoe het werkt, wat de valkuilen zijn en hoe je AI het beste kan gebruiken. Daarna vullen ze een korte vragenlijst in (onderwerp, onderdeel, leerstijl). De antwoorden worden gebruikt om een Socratische prompt te maken. 

De prompt wordt lokaal gegenereerd via WebGPU met een gekwantiseerd LLM (Qwen3.5-4B-q4f32_1-MLC) of via een sjabloon als WebGPU niet beschikbaar is. Het resultaat kan worden bewerkt, gekopieerd, gedownload of naar externe AI-providers gestuurd voor onmiddellijk gebruik.

Verder bevat de website een ingebouwd benchmarksysteem die 20 verschillende scenario's langs gaat met als doel om te waarborgen dat de socratische prompts correct en veilig wordt gegenereerd.

Dit project richt zich op privacy, educeren over bewust AI gebruik en de vaardigheid van lokale AI modellen op consumenten hardware.

## Vereisten

Dit project maakt gebruik van [Bun](https://bun.sh/) als runtime en package manager. Zorg dat Bun is geïnstalleerd voordat je begint.

Installatie instructie (MacOS/Linux):
```bash
curl -fsSL https://bun.sh/install | bash
```

Installatie instructie (Windows):
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

## Codebase Overzicht

### Tech Stack

- Runtime en package manager: Bun
- Taal: TypeScript
- UI: React, React Router
- Bundelaar: Vite
- Testen: Vitest, React Testing Library, jsdom, V8 coverage
- Linting: ESLint, typescript-eslint, React Hooks, React Refresh
- Internationalisatie: i18next, react-i18next
- Lokale AI: WebLLM, WebGPU
- Deployment: GitHub Actions, GitHub Pages

### Mapstructuur

- `public/`: statische bestanden
- `src/components/`: UI componenten
- `src/contexts/`: React Context providers en hooks
- `src/hooks/`: React hooks voor state logica
- `src/services/`: bedrijfslogica, storage en WebLLM integratie
- `src/types/`: TypeScript typedefinities en service interfaces
- `src/utils/`: kleine hulpfuncties
- `src/locales/`: vertaal JSON bestanden
- `src/__tests__/`: unit en componenttesten
- `benchmark/`: aparte benchmark applicatie voor promptkwaliteit
- `.github/workflows/`: GitHub Pages deployment workflow

## Commands

- `bun run dev`: start de dev server
- `bun run build`: typecheck en productiebuild
- `bun run preview`: start server vanuit de productiebuild
- `bun run lint`: draai ESLint over het hele project
- `bun run test`: draai alle tests via Vitest
- `bun run test:coverage`: draai Vitest met V8 coverage reporter
- `bun run test:benchmark`: start de dev server voor de benchmark applicatie

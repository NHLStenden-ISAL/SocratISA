# SocratISA

Een Socratische AI uitleg en generatie webapplicatie gebouwd voor het ISA Lab van NHL Stenden. 

Gebruikers lezen over wat AI is, hoe het werkt, wat de valkuilen zijn en hoe je AI het beste kan gebruiken. Daarna vullen ze een korte vragenlijst in (onderwerp, onderdeel, leerstijl). De antwoorden worden gebruikt om een Socratische prompt te maken. 

De prompt wordt lokaal gegenereerd via WebGPU met een gekwantiseerd LLM (Qwen3.5-4B-q4f32_1-MLC) of via een sjabloon als WebGPU niet beschikbaar is. Het resultaat kan worden bewerkt, gekopieerd, gedownload of naar externe AI-providers gestuurd voor onmiddellijk gebruik.

Verder bevat de website een ingebouwd benchmarksysteem die 20 verschillende scenario's langs gaat met als doel om te waarborgen dat de socratische prompts correct en veilig wordt gegenereerd.

Dit project richt zich op privacy, educeren over bewust AI gebruik en de vaardigheid van lokale AI modellen op consumenten hardware.

## Vereisten

Dit project maakt gebruik van [Bun](https://bun.sh/) als runtime en package manager. Zorg dat Bun is geïnstalleerd voordat je begint.

Installatie instructie:
```bash
curl -fsSL https://bun.sh/install | bash
```

Commando's kunnen ook worden uitgevoerd met `npm` inplaats van `bun`, maar dit is niet aanbevolen.

## Codebase Overzicht

### Tech Stack

- Taal: TypeScript
- UI: React, React Router
- Bundelaar: Vite
- Testen: Vitest, React Testing Library
- Linting: ESLint + typescript-eslint
- I18n: i18next + react-i18next
- Iconen: FontAwesome
- Lokale AI: WebLLM + WebGPU

### Architectuur

De applicatie volgt een drie-lagen architectuur:

**Presentatielaag (Frontend)**
- UI-componenten in React + TypeScript
- Beheer van state via React Context
- Routing via React Router

**Servicelaag (Business Logica)**
- WebLLMService: interactie met lokaal AI model via WebGPU
- FallbackService: generatie van standaard prompts zonder WebGPU
- PromptGeneratorService: coördineert prompt generatie, events en statistieken
- SurveyService: verzamelt en valideert vragenlijstantwoorden
- ProviderService: bouwt URLs voor externe AI-providers

**Datalaag (Data)**
- localStorage: gebruikersvoorkeuren
- sessionStorage: promptresultaat tijdens sessie
- StorageService: abstractie over localStorage operaties

Alle lagen communiceren via dependency injection met React Context.

### Mapstructuur

- `public/` - Statische bestanden
- `src/components/` - UI-componenten
- `src/contexts/` - React context providers en hooks
- `src/hooks/` - React hooks voor state-logica
- `src/services/` - Bedrijfslogica en externe integraties
- `src/types/` - TypeScript typedefinities
- `src/utils/` - Kleine hulpfuncties
- `src/locales/` - Vertaal JSON-bestanden
- `src/__tests__/` - Unit- en componenttesten
- `benchmark/` - Benchmark-applicatie voor het testen van prompt kwaliteit

## Commands

- `bun run dev` - Start dev-server
- `bun run build` - Type-check (`tsc -b`) gevolgd door productiebuild (`vite build`)
- `bun run preview` - Start server vanuit de productiebuild
- `bun run lint` - Draai ESLint over het hele project
- `bun run test` - Draai alle tests via Vitest
- `bun run test:coverage` - Draai Vitest met V8 coverage reporter
- `bun run test:benchmark` - Start de dev-server voor de benchmark-applicatie

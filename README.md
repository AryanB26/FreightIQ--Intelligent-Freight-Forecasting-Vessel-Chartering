# FreightIQ

> Forecast the market. Choose the right vessel. Charter at the right time. Optimize utilization.

FreightIQ is a maritime freight decision-support platform designed to help bulk-cargo procurement and logistics teams make data-driven vessel chartering decisions. It brings together freight forecasting, market-entry intelligence, vessel selection, charter planning, risk analysis, scenario analysis, vessel utilization, and maritime visualization in a single platform.

---

## Problem Statement

Bulk-cargo chartering and maritime freight procurement operate in highly volatile, fragmented, and fast-moving environments. Shippers, charterers, and industrial procurement desks frequently encounter:

- **Volatile freight markets** with sharp, unexpected rate fluctuations across Baltic indices and dry-bulk routes.
- **Reactive spot-market decisions** driven by immediate cargo readiness rather than forward-looking rate trajectories.
- **Vessel availability constraints** and geographic mismatches between available tonnage and cargo laycans.
- **Vessel capacity and hold limitations**, resulting in suboptimal fixture sizes or deadfreight penalties.
- **Port restrictions** including draft limits, beam constraints, LOA restrictions, and berth loading rates.
- **Suboptimal freight timing**, locking in contracts right before cyclical market downturns.
- **Operational and geopolitical risks**, from choke-point disruptions and canal delays to weather storms and bunker price shocks.
- **Inefficient vessel utilization**, where chartered vessels carry cargo well below their maximum volume without identifying co-loading opportunities.

FreightIQ transitions the maritime freight procurement workflow from reactive chartering toward data-driven, forward-looking strategic planning.

---

## Solution

FreightIQ functions as an intelligent decision-support system that models the entire chartering lifecycle through a cohesive analytics workflow:

```
Market & Historical Data
           ↓
Freight Forecasting
           ↓
Market Entry Timing
           ↓
Vessel Selection
           ↓
Port Compatibility
           ↓
Charter Strategy
           ↓
Risk & Scenario Analysis
           ↓
Capacity Optimization
```

1. **Ingest & Normalize**: Ingests historical freight rate observations, vessel positions, port infrastructure limits, and commodity corridors.
2. **Forecast Trajectories**: Evaluates statistical baselines and machine-learning models to generate multi-horizon freight rate forecasts with confidence intervals.
3. **Time Market Entry**: Compares spot rates against forward curves to advise whether to charter immediately, defer, or split voyages.
4. **Select & Match Vessels**: Evaluates vessel classes (Capesize, Panamax, Supramax, Handysize) against origin and destination port physical constraints.
5. **Formulate Charter Strategies**: Evaluates single-voyage spot fixtures, multi-voyage contracts, and mixed fleet allocations with full cost breakdowns.
6. **Quantify Risk & Simulate Scenarios**: Models weather exposure, geopolitical chokepoints, port congestion, and bunker price sensitivity.
7. **Optimize Capacity**: Detects unused hold capacity on fixed voyages and deterministically matches compatible parcel opportunities to maximize utilization.

> **Note**: FreightIQ is an analytical decision-support platform and prototype designed to inform commercial chartering teams—not an autonomous broker or automated execution engine.

---

## Key Features

- **Freight Market Dashboard**: Real-time snapshot of daily dry-bulk freight rates, market sentiment signals, 30-day forward outlook, and key operational indicators across major routes.
- **Freight Rate Forecasting**: Multi-horizon rate forecasting (7, 14, 30, and 90 days) featuring confidence intervals, historical baseline benchmarks, and machine-learning regressors.
- **Market Entry Advisor**: Actionable chartering timing recommendations (e.g., *Charter Now*, *Hold / Defer*, *Secure Contract*) based on rate volatility, market direction, and laycan flexibility.
- **Vessel & Voyage Tracking**: Interactive MapLibre GL vector basemap rendering active vessel positions, voyage route corridors, submarine cable infrastructure, and live voyage progress.
- **Vessel-Port Compatibility Engine**: Automated physical constraint verification checking draft, beam, LOA, DWT, and terminal handling capabilities across global ports.
- **Charter Planner**: Multi-voyage allocation planner comparing vessel allocations, transit schedules, and comprehensive cost breakdowns (freight, bunker, port, operating, and positioning).
- **Spot vs. Multi-Voyage Strategy Comparison**: Side-by-side economic evaluation highlighting cost differences, risk exposures, and estimated savings between spot fixtures and structured charter contracts.
- **Vessel Capacity Utilization**: Detailed hold utilization metrics across all proposed voyages to prevent deadfreight.
- **Unused Vessel Capacity Opportunity Identification**: Identifies compatible cargo opportunities for otherwise-unused vessel capacity to improve vessel utilization without altering baseline charter terms.
- **Idle Vessel Advisor**: Monitors idle and off-hire tonnage globally, calculating positioning distances, daily burn rates, and potential employment fixtures.
- **Operational & Geopolitical Risk Analysis**: Multi-dimensional risk engine tracking chokepoints, piracy corridors, severe weather systems, and port congestion levels.
- **What-If Scenario Analysis**: Interactive sensitivity modeling for bunker fuel price spikes, canal route closures, weather delays, and demand shocks.
- **Historical Freight Analytics**: Deep retrospective rate analysis across multi-year commodity corridors, rate distributions, and seasonal trendlines.
- **Maritime Infrastructure Visualization**: Global port directory with berth specifications, draft constraints, and maximum vessel size limits.
- **Explainable Decision Factors**: Transparent scorecards and objective weightings (cost, utilization, transit time, risk) detailing why specific strategies are recommended.
- **3D Maritime Intelligence**: High-fidelity 3D globe visualization powered by CesiumJS displaying global shipping corridors, satellite feeds, and vessel tracking.

---

## Platform Modules

| Module | Route | Purpose |
|---|---|---|
| **Landing Page** | `/` | Platform introduction, key capabilities, and direct access to core modules |
| **Executive Dashboard** | `/executive` | High-level executive overview of freight benchmarks, market signals, and operational KPIs |
| **Voyages & Vessel Tracker** | `/voyages` | Interactive MapLibre vector map tracking active vessels, routes, cables, and voyages |
| **Maritime Intelligence (God's Eye)** | `/intelligence` | 3D CesiumJS globe visualizing global maritime corridors, traffic density, and port hubs |
| **Charter Planner** | `/charter-planner` | Strategic charter planner with multi-voyage modeling, cost breakdowns, and capacity matching |
| **Market Entry Advisor** | `/market-entry` | Optimal charter timing intelligence, spot vs. forward signals, and decision thresholds |
| **Forecasting** | `/forecasting` | Probabilistic freight rate forecasts across 7, 14, 30, and 90-day planning horizons |
| **Freight Market** | `/freight-market` | Benchmark indices, route-by-route rate sheets, and commodity spreads |
| **Historical Analytics** | `/history` | Historical freight rate time-series, volatility trends, and seasonal heatmaps |
| **Idle Vessels** | `/idle-vessels` | Idle fleet tracking, re-employment opportunities, and positioning cost minimization |
| **Risk Intelligence** | `/risks` | Chokepoint exposure, weather disruptions, port congestion, and risk heatmaps |
| **Scenario Simulation** | `/scenarios` | What-if simulation engine for bunker shocks, canal rerouting, and voyage delays |
| **Fleet Directory** | `/vessels` | Comprehensive vessel database with DWT, draft, LOA, hold volumes, and operational specs |
| **Port Directory** | `/ports` | Global port infrastructure specifications, draft limits, and terminal loading rates |
| **Data Platform** | `/data-center` | Data feed status, telemetry monitoring, data freshness, and API connectivity |
| **Intelligence Assistant** | `/assistant` | Explainable conversational interface providing decision support and route insights |

---

## Technology Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React Server Components, Client Components)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5.7](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a dark enterprise terminal aesthetic
- **Component Primitives**: [Radix UI](https://www.radix-ui.com/) (`@radix-ui/react-accordion`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, etc.)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Utility Libraries**: `clsx`, `tailwind-merge`, `class-variance-authority`, `cmdk`

### Mapping & Geospatial Visualization
- **MapLibre GL JS** (`maplibre-gl` v6): High-performance vector tile basemap rendered with OpenFreeMap Liberty styling, custom GeoJSON layers for voyage corridors, submarine cables, port nodes, and interactive vessel markers.
- **CesiumJS** (`cesium` v1.144): 3D geospatial globe visualization for maritime traffic density, global corridors, and spatial intelligence.
- **Leaflet & React-Leaflet**: Geospatial map utility components.

### Backend & Core Engines
- **API Layer**: Next.js App Router Route Handlers (`src/app/api/*`) delivering structured REST endpoints for optimization, forecasting, idle fleet, risks, and market telemetry.
- **Charter Optimization Engine** (`src/services/charter-planner/`): Multi-voyage scheduling, vessel allocation algorithms, and cost decomposition models.
- **Decision Engine** (`src/services/decision-engine/`): Multi-criteria decision analysis (MCDA) balancing cost, utilization, transit time, and operational risk.
- **Forecasting Pipeline** (`src/services/forecasting/`): Analytical pipeline supporting baseline estimators (Moving Average, Holt's Exponential Smoothing, Linear Regression) and machine-learning regressors (Random Forest, Gradient Boosting).
- **Vessel-Port Compatibility Engine** (`src/services/compatibility.ts`): Rule-based constraint verification checking maritime physical boundaries.
- **Risk Assessment Engine** (`src/services/risk-engine/`): Multi-factor risk scoring evaluating geopolitical risk, chokepoint vulnerability, and congestion metrics.

### Data Storage & Telemetry
- **Deterministic Seed Architecture** (`src/data/seed/`): Curated maritime datasets covering dry-bulk vessels, vessel specifications, international ports, historic freight rates, and submarine communication cables.
- **In-Memory Market Store** (`src/lib/market-data-store.ts`): High-throughput in-memory state store for continuous telemetry and simulation.

### Development & Testing
- **Test Runner**: [Vitest](https://vitest.dev/) (294 automated unit and integration tests passing across 7 test suites)
- **Linter**: ESLint 9 with `eslint-config-next`
- **Compiler**: TypeScript compiler (`tsc`)

---

## Architecture

```
                                  User Browser / Client
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │      FreightIQ Web Application (Next.js 15)   │
                    │                                               │
                    │   ├── Presentation Layer (Tailwind CSS v4)    │
                    │   ├── Design System & Radix UI Primitives     │
                    │   ├── MapLibre GL Vector Map Overlay          │
                    │   └── CesiumJS 3D Maritime Globe              │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │      Internal REST API Routes (/api/*)        │
                    │                                               │
                    │   ├── /api/charter/optimize & /compare        │
                    │   ├── /api/forecast & /api/forecasts          │
                    │   ├── /api/freight-rates & /api/market-entry  │
                    │   ├── /api/idle & /api/opportunities          │
                    │   ├── /api/risks & /api/scenarios             │
                    │   └── /api/voyages & /api/vessels             │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │          Intelligence & Decision Services     │
                    │                                               │
                    │   ├── Charter Planner & Capacity Matcher      │
                    │   ├── Multi-Horizon Forecasting Pipeline      │
                    │   ├── Market Entry & Timing Advisor           │
                    │   ├── Idle Vessel Positioning Engine          │
                    │   ├── Vessel-Port Compatibility Checker       │
                    │   ├── Multi-Factor Risk Engine                │
                    │   └── Scenario Sensitivity Simulator          │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │              Data & State Layer               │
                    │                                               │
                    │   ├── Deterministic Seed Data (Vessels/Ports) │
                    │   ├── Historical Freight Observations         │
                    │   └── In-Memory Telemetry & Route Store       │
                    └───────────────────────────────────────────────┘
```

---

## Project Structure

```
FreightIQ/
├── public/                     # Static assets, logos, and Cesium engine assets
│   ├── cesium/                 # CesiumJS static worker and asset files
│   └── logo.png                # FreightIQ brand logo
├── src/
│   ├── __tests__/              # Automated test suites (294 passing Vitest tests)
│   │   ├── charter-planner.test.ts
│   │   ├── data-platform.test.ts
│   │   ├── decision-engine.test.ts
│   │   ├── forecasting.test.ts
│   │   ├── idle-engine.test.ts
│   │   ├── market-analytics.test.ts
│   │   └── risk-engine.test.ts
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Main dashboard application modules
│   │   │   ├── assistant/      # Intelligence Assistant interface
│   │   │   ├── charter-planner/# Strategic charter planning & capacity matching
│   │   │   ├── data-center/    # Telemetry and data health monitoring
│   │   │   ├── executive/      # Executive KPI & market overview dashboard
│   │   │   ├── forecasting/    # Multi-horizon freight forecasting
│   │   │   ├── freight-market/ # Benchmark indices and route analysis
│   │   │   ├── history/        # Historical freight rate analysis
│   │   │   ├── idle-vessels/   # Idle fleet positioning advisor
│   │   │   ├── intelligence/   # 3D Cesium maritime globe intelligence
│   │   │   ├── market-entry/   # Charter timing advisor
│   │   │   ├── ports/          # Port infrastructure directory
│   │   │   ├── risks/          # Operational and geopolitical risk engine
│   │   │   ├── scenarios/      # What-if scenario simulation
│   │   │   ├── vessels/        # Vessel fleet directory and specifications
│   │   │   └── voyages/        # MapLibre GL voyage tracking
│   │   ├── api/                # Next.js Serverless REST API route handlers
│   │   ├── globals.css         # Global Tailwind CSS styling & theme variables
│   │   └── page.tsx            # Platform landing page
│   ├── components/             # Reusable UI and visualization components
│   │   ├── dashboard/          # Specialized KPI and outlook cards
│   │   ├── layout/             # Shared TopNav header and navigation
│   │   ├── maps/               # MapLibre GL vector tracking components
│   │   ├── maritime/           # CesiumJS 3D globe and overlay panels
│   │   └── ui/                 # Radix UI components and primitives
│   ├── data/
│   │   └── seed/               # Deterministic maritime datasets (ports, vessels, rates)
│   ├── services/               # Core intelligence services & algorithms
│   │   ├── charter-planner/    # Charter allocation and capacity consolidation
│   │   ├── decision-engine/    # Multi-criteria strategy scoring
│   │   ├── forecasting/        # Machine-learning and baseline forecasting models
│   │   ├── idle-engine/        # Idle vessel tracking and positioning
│   │   └── risk-engine/        # Multi-factor operational risk scoring
│   └── types/                  # Domain TypeScript definitions and contracts
├── .env.example                # Environment variable configuration template
├── package.json                # Project dependencies and script definitions
├── tsconfig.json               # TypeScript configuration
└── vitest.config.ts            # Vitest testing configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18.18+ or higher (tested on Node.js 20, 22, and 24)
- **Package Manager**: `npm` (comes with Node.js), `pnpm`, or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ayushk2206-source/FreightIQ.git
   cd FreightIQ
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   > **Note**: FreightIQ runs completely out-of-the-box in `DATA_PROVIDER_MODE=demo` using rich, deterministic maritime seed data. No external API keys or external database setup are required to run and test the platform.

### Running Locally

Start the Next.js development server:

```bash
npm run dev
```

Open your browser and navigate to:

```
http://localhost:3000
```

- Visit `/` for the platform landing page.
- Visit `/executive` for the Executive Dashboard.
- Visit `/charter-planner` to test the Charter Planner and Capacity Opportunity engine.
- Visit `/voyages` for the MapLibre GL vessel and route tracking map.
- Visit `/intelligence` for the CesiumJS 3D maritime globe.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server on port 3000 with hot-reloading |
| `npm run build` | Compiles and builds the production-ready Next.js application bundle |
| `npm start` | Starts the production server after running `npm run build` |
| `npm run lint` | Runs ESLint to verify code quality and style compliance |
| `npx vitest run` | Executes all 294 automated unit and integration tests across 7 test suites |
| `npx tsc --noEmit` | Runs the TypeScript compiler to verify zero type errors across the project |

---

## Verification & Testing

FreightIQ maintains high code quality and test coverage across all decision engines and data pipelines:

```bash
npx vitest run
```

```
✓ src/__tests__/market-analytics.test.ts (38 tests)
✓ src/__tests__/decision-engine.test.ts (40 tests)
✓ src/__tests__/charter-planner.test.ts (29 tests)
✓ src/__tests__/idle-engine.test.ts (48 tests)
✓ src/__tests__/risk-engine.test.ts (55 tests)
✓ src/__tests__/data-platform.test.ts (49 tests)
✓ src/__tests__/forecasting.test.ts (35 tests)

Test Files  7 passed (7)
     Tests  294 passed (294)
```

TypeScript type-checking:
```bash
npx tsc --noEmit
```
Exits with code `0` and 0 errors.

---

## Disclaimer

FreightIQ is a prototype and decision-support tool created for demonstration and analytical modeling purposes. All market data, rate predictions, and vessel schedules are generated using deterministic models and synthetic seed data. It does not execute live financial transactions or legally binding charter-party agreements.
# Atomic Design Structure - Visual Guide

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                           PAGES                                  │
│  (Thin wrappers that initialize data and wrap features)         │
├─────────────────────────────────────────────────────────────────┤
│  • ScoreboardPage                                                │
│  • MatchesPage                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TEMPLATES                                │
│  (Layout structures for pages)                                   │
├─────────────────────────────────────────────────────────────────┤
│  • AppLayout (Spotify-style shell)                               │
│  • MainContentTemplate                                           │
│  • SidebarLayoutTemplate                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FEATURES                                  │
│  (Containers that connect data layer to organisms)              │
├─────────────────────────────────────────────────────────────────┤
│  • ScoreboardContainer                                           │
│  • MatchesContainer                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ORGANISMS                                 │
│  (Complex UI sections composed of molecules)                    │
├─────────────────────────────────────────────────────────────────┤
│  SCOREBOARD:                                                     │
│  • ScoreboardHeader                                              │
│  • ScoreboardPlayerRow                                           │
│  • ScoreboardTable                                               │
│  • RosterGrid                                                    │
│  • BenchGrid                                                     │
│  • PlayerBoard                                                   │
│  • BoardVisualizer ⭐ (independent!)                             │
│                                                                  │
│  MATCHES:                                                        │
│  • MatchesTableRow                                               │
│  • MatchesTable                                                  │
│  • MatchDetailPanel                                              │
│  • PlacementBoard                                                │
│                                                                  │
│  SHARED:                                                         │
│  • NavigationBar 🎵 (Spotify-style!)                            │
│  • ConnectionStatusBar                                           │
│  • MatchInfoBar                                                  │
│  • EmptyState                                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MOLECULES                                 │
│  (Simple combinations of atoms)                                 │
├─────────────────────────────────────────────────────────────────┤
│  • HeroPortrait (HeroImage + StarIcon[])                        │
│  • StatDisplay (Icon + Text)                                     │
│  • StreakBadge (Badge + logic)                                   │
│  • RecordDisplay (Text + formatting)                             │
│  • ChangeEvent (Text + styling)                                  │
│  • ChangeBar (ChangeEvent[])                                     │
│  • MatchIdDisplay (Text + code variant)                          │
│  • RoundInfo (Text + Text)                                       │
│  • DurationDisplay (Text + calculation)                          │
│  • PlayerNameDisplay (Text + fallback)                           │
│  • SortableHeader (Text + arrow)                                 │
│  • ConnectionStatus (StatusIndicator + Text)                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ATOMS                                   │
│  (Basic building blocks - cannot be broken down)                │
├─────────────────────────────────────────────────────────────────┤
│  • Button                                                        │
│  • Badge                                                         │
│  • Icon                                                          │
│  • HeroImage                                                     │
│  • StarIcon                                                      │
│  • Text                                                          │
│  • Spinner                                                       │
│  • StatusIndicator                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Action
    │
    ▼
┌─────────┐
│  Page   │ ◄──── Initialize WebSocket / Load Data
└────┬────┘
     │
     ▼
┌─────────┐
│Template │ ◄──── Provides Layout Structure
└────┬────┘
     │
     ▼
┌─────────┐
│Feature  │ ◄──── Connects Redux Store / API
│Container│       Manages State Logic
└────┬────┘
     │
     ▼
┌─────────┐
│Organism │ ◄──── Receives Props
└────┬────┘       Renders UI
     │
     ▼
┌─────────┐
│Molecule │ ◄──── Combines Atoms
└────┬────┘       Adds Logic
     │
     ▼
┌─────────┐
│  Atom   │ ◄──── Pure UI Element
└─────────┘
```

## Real Example: Scoreboard Player Row

```
ScoreboardPlayerRow (Organism)
├── ChangeBar (Molecule)
│   └── ChangeEvent[] (Molecule)
│       └── Text (Atom)
├── PlayerNameDisplay (Molecule)
│   └── Text (Atom)
├── StatDisplay (Molecule)
│   ├── Icon (Atom)
│   └── Text (Atom)
├── StreakBadge (Molecule)
│   └── Badge (Atom)
├── RecordDisplay (Molecule)
│   └── Text (Atom)
└── HeroPortrait[] (Molecule)
    ├── HeroImage (Atom)
    └── StarIcon[] (Atom)
```

## App Layout Structure (Spotify-style)

```
┌──────────────────────────────────────────────────────────┐
│                        AppLayout                          │
│  ┌────────────┬────────────────────────────────────────┐ │
│  │            │                                        │ │
│  │ Navigation │         Main Content Area              │ │
│  │    Bar     │                                        │ │
│  │            │  ┌──────────────────────────────────┐  │ │
│  │  📊 Score  │  │  ConnectionStatusBar (optional)  │  │ │
│  │     board  │  └──────────────────────────────────┘  │ │
│  │            │                                        │ │
│  │  🎮 Match  │  ┌──────────────────────────────────┐  │ │
│  │     es     │  │                                  │  │ │
│  │            │  │      Page Content                │  │ │
│  │            │  │  (ScoreboardContainer or         │  │ │
│  │            │  │   MatchesContainer)              │  │ │
│  │            │  │                                  │  │ │
│  │            │  └──────────────────────────────────┘  │ │
│  │            │                                        │ │
│  └────────────┴────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Key Benefits

### 1. **Reusability**
Every component can be used independently:
```typescript
// Use HeroPortrait anywhere
<HeroPortrait unitId={123} rank={3} heroesData={data} />

// Use BoardVisualizer in any feature
<BoardVisualizer selectedPlayers={players} heroesData={data} onPlayerClose={handleClose} />
```

### 2. **Testability**
Each level can be tested in isolation:
```typescript
// Test atom
<Button variant="primary">Click me</Button>

// Test molecule
<StatDisplay type="gold" value={100} />

// Test organism
<ScoreboardTable players={mockPlayers} selectedPlayerIds={[]} onPlayerSelect={jest.fn()} />
```

### 3. **Scalability**
Easy to add new features:
```typescript
// New page? Just add atoms/molecules/organisms
// All existing components are available to use!
```

### 4. **Maintainability**
Clear separation of concerns:
- **Atoms**: Pure UI elements (no logic)
- **Molecules**: Simple compositions (minimal logic)
- **Organisms**: Complex UI (business logic)
- **Features**: Data connections (Redux/API)
- **Pages**: Routing (thin wrappers)

## Migration Path (What Changed)

### Before:
```
components/Scoreboard/
├── PlayerRow.tsx (everything in one file)
├── ScoreboardTable.tsx (tightly coupled)
└── BoardVisualizer.tsx (embedded in Scoreboard)
```

### After:
```
components/
├── atoms/ (8 reusable elements)
├── molecules/ (12 combinations)
├── organisms/ (15 sections)
└── templates/ (3 layouts)

features/
├── scoreboard/ScoreboardContainer.tsx
└── matches/MatchesContainer.tsx

pages/
├── Scoreboard.tsx (thin wrapper)
└── Matches.tsx (thin wrapper)
```

## Summary

The app is now:
- ✅ **Modular**: Components are independent and reusable
- ✅ **Maintainable**: Clear structure and separation of concerns
- ✅ **Scalable**: Easy to add new features
- ✅ **Beautiful**: Spotify-like single-app experience
- ✅ **Functional**: All existing features preserved
- ✅ **Type-safe**: 0 TypeScript errors
- ✅ **Production-ready**: Successful build

You now have a professional-grade, enterprise-ready component architecture! 🚀


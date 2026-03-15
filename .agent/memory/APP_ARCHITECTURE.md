# CaveDiveCalc — Full Application Architecture & Code Logic

> **Purpose**: Read this FIRST before modifying any code. It documents every module's architecture, data models, formulas, code flow, and HTML wiring. This should eliminate the need to re-read source files in most cases.
> **Last updated**: Feb 12, 2026

---

## 1. OVERVIEW

**CaveDiveCalc** is a single-page, static web app for cave diving calculations. No build tools, no framework, no backend.

- **Stack**: Vanilla HTML + CSS + JavaScript
- **Font**: Inter (Google Fonts CDN)
- **Styling**: `styles/main.css` — dark theme (#0a1220 bg), glassmorphism, cyan accent (#00d4ff)
- **Unit System**: Imperial default, Metric toggle via `App.isMetric`
- **All math is done in Imperial internally** — metric conversion only at display time

---

## 2. FILE STRUCTURE & LOAD ORDER

```
CAVE DIVING APP/
├── index.html              (881 lines — all sections, scripts loaded at bottom)
├── styles/main.css         (dark theme, responsive, glassmorphism)
├── scripts/
│   ├── units.js            → UnitConverter (loads 1st, used by all)
│   ├── tanks.js            → Tanks + TankCalculator
│   ├── weights.js          → WeightCalculator
│   ├── gasplan.js          → GasPlan
│   ├── penetration.js      → PenetrationCalculator
│   ├── sac.js              → SACCalculator
│   ├── nitrox.js           → NitroxCalculator
│   ├── po2table.js         → PO2Table
│   ├── checklist.js        → EquipmentChecklist
│   └── app.js              → App (loads LAST, calls .init() on everything)
└── assets/                 (empty)
```

Scripts load order matters: `units.js` first (dependency), `app.js` last (orchestrator).

---

## 3. APP CONTROLLER (`app.js` — 175 lines)

### How It Works
```
DOMContentLoaded → App.init()
  ├── initNavigation()     — binds click handlers on .nav-link[data-section]
  ├── initUnitToggle()     — binds Imperial/Metric buttons
  ├── initMobileMenu()     — hamburger toggle for sidebar
  └── initAllModules()     — calls .init() on every module in order
```

### Navigation Flow
1. User clicks nav link → `showSection(sectionId)` fires
2. All `<section class="calculator-section">` get `.active` removed
3. Target section gets `.active` added (CSS shows/hides via display)
4. URL hash updated: `history.replaceState(null, '', '#weights')`
5. `refreshSection(sectionId)` called → triggers that module's `updateDisplay()`

### Unit Toggle Flow
1. User clicks Imperial/Metric button
2. `App.isMetric` set to `true`/`false`
3. `updateUnitLabels()` swaps text in all `.input-unit` spans (PSI↔bar, ft↔m, lbs↔kg)
4. `refreshSection(currentSection)` re-renders current calculator with new units

### refreshSection Switch Map
```javascript
case 'tanks':       TankCalculator.updateDisplay(tankType)
case 'weights':     WeightCalculator.updateDisplay()
case 'gasplan':     GasPlan.updateDisplay()
case 'penetration': PenetrationCalculator.updateDisplay()
case 'sac':         SACCalculator.updateDisplay()
case 'nitrox':      NitroxCalculator.updateO2Display() + updateBestMix()
case 'po2':         PO2Table.generateTable()
case 'checklist':   EquipmentChecklist.render()
```

---

## 4. UNIT CONVERTER (`units.js` — 124 lines)

### Constants
```javascript
PSI_TO_BAR:    0.0689476
BAR_TO_PSI:    14.5038
FEET_TO_METERS: 0.3048
METERS_TO_FEET: 3.28084
CUFT_TO_LITERS: 28.3168
LBS_TO_KG:     0.453592
KG_TO_LBS:     2.20462
```

### Key Function Used Everywhere
```javascript
UnitConverter.round(value, decimals)
// Rounds to N decimal places, used by every module for display
```

### Temperature Conversions
```javascript
F_TO_C(f) = (f - 32) * 5 / 9
C_TO_F(c) = (c * 9 / 5) + 32
```

### How init() Works
- Binds `input` event listeners on paired input fields (#psiInput↔#barInput, etc.)
- When one input changes, calculates the other using the conversion constant
- Bidirectional: typing in PSI updates BAR and vice versa

---

## 5. TANK DATABASE (`tanks.js` — ~190 lines)

### Tank Data Model
Each tank in `Tanks.tanks` object:
```javascript
{
  name: 'AL80 Catalina',
  material: 'aluminum',       // 'aluminum' or 'steel'
  ratedVolume: 77.4,          // ft³ at working pressure
  workingPressure: 3000,      // PSI
  weight: 31.6,               // lbs (empty, in air)
  buoyancyEmpty: 2.8,         // lbs (positive = floats)
  buoyancyFull: -1.52,        // lbs (negative = sinks)
  diameter: 7.25,             // inches
  length: 26.1                // inches
}
```

### Complete Tank Table
| Key      | Name            | Vol  | WP    | Wt    | Empty  | Full   |
|----------|-----------------|------|-------|-------|--------|--------|
| `al80`   | AL80 Catalina   | 77.4 | 3000  | 31.6  | +2.8   | -1.52  |
| `al40`   | AL40            | 40   | 3000  | 18.0  | +2.4   | -0.6   |
| `al63`   | AL63            | 63   | 3000  | 24.4  | +2.0   | -1.2   |
| `hp100`  | Faber HP100     | 100  | 3442  | 33.2  | -0.59  | -8.41  |
| `hp120`  | Faber HP120     | 120  | 3442  | 38.5  | +0.65  | -8.82  |
| `hp80`   | Faber HP80      | 80   | 3442  | 28.3  | -1.74  | -8.05  |
| `lp85`   | Faber LP85      | 85   | 2640  | 30.2  | +2.32  | -3.24  |
| `lp108`  | Faber LP108     | 108  | 2640  | 37.0  | +1.84  | -5.32  |
| `lp120`  | Faber LP120     | 120  | 2640  | 41.0  | +1.2   | -6.2   |
| `sm50`   | Faber Steel 50  | 50   | 2640  | 22.1  | +1.24  | -2.43  |

### getTank(tankId) — Variant Handling
```javascript
getTank(tankId) {
  // Direct match first
  if (this.tanks[tankId]) return this.tanks[tankId];

  // Parse prefix: "doubles_lp85" → baseId="lp85", isDoubles=true
  // Parse prefix: "sm_hp100" → baseId="hp100", isSidemount=true
  
  // If base tank found, return derived object with ×2 multiplied:
  //   ratedVolume, weight, buoyancyEmpty, buoyancyFull
  // Name gets suffix: " Doubles" or " SM"
  
  // Fallback: returns this.tanks.hp100
}
```

### TankCalculator
- `updateDisplay(tankId)` — shows detailed card with tank specs
- Generates SVG visualization of the tank with:
  - Steel tanks: rounded bottom + boot detail
  - Aluminum tanks: flat bottom
  - Buoyancy bar chart (empty vs full)
  - Weight comparison bar
- HTML: `#tankType` dropdown triggers `updateDisplay()`

---

## 6. WEIGHT CALCULATOR (`weights.js` — ~340 lines)

### Core Formula
```
Total Lead (lbs) = Body Buoyancy + BCD Net Buoyancy + Wetsuit Lift + Tank Empty Buoyancy
Result = Math.max(0, Math.round(total))
```

### Data Tables

**Body Buoyancy** (`baseMultiplier`):
```javascript
fresh: 0.015   // 1.5% of body weight (body nearly neutral in fresh)
salt:  0.04    // 4.0% of body weight (saltwater more buoyant)
```

**Wetsuit Buoyancy** (`wetsuitBuoyancy`, lbs at surface):
```javascript
none: 0, '3mm': 5, '5mm': 10, '7mm': 16, drysuit: 18
```

**BCD Net Buoyancy** (`bcdBuoyancy`, lbs — includes backplate effect):
```javascript
'bp-steel':    -3.5   // Steel plate (~-5 lbs) + wing bladder (~+1.5) = net -3.5
'bp-aluminum': +1.5   // Aluminum plate (~neutral) + wing bladder (+1.5) = net +1.5
'sm-xdeep':    +1.5   // Xdeep Stealth Tec 2.0 (no plate, just harness+bladder)
'sm-diverite': +1.5   // Dive Rite Ray (Nomad Ray)
'sm-katana':   +1.5   // Hollis Katana 2
```

**Tank Config Buoyancy** (`tankConfigBuoyancy`, lbs EMPTY, end-of-dive):
```javascript
'single-al':         +2.8    // AL80 empty
'single-steel':      -0.59   // HP100 empty
'doubles-lp':        +4.64   // 2× LP85 empty (+2.32 each)
'doubles-hp':        -1.18   // 2× HP100 empty (-0.59 each)
'sidemount-al80':    +5.6    // 2× AL80 empty (+2.8 each)
'sidemount-al40':    +4.8    // 2× AL40 empty (+2.4 each)
'sidemount-lp85':    +4.64   // 2× LP85 empty (+2.32 each)
'sidemount-steel50': +2.48   // 2× SM50 empty (+1.24 each)
```

### calculate() Flow
```javascript
calculate(bodyWeight, wetsuitType, tankConfig, waterType, bcdType) {
  baseBuoyancy = bodyWeight × baseMultiplier[waterType]     // e.g. 180 × 0.015 = 2.7
  bcdLift      = bcdBuoyancy[bcdType]                       // e.g. -3.5 for steel BP
  wetsuitLift  = wetsuitBuoyancy[wetsuitType]               // e.g. 10 for 5mm
  tankBuoyancy = tankConfigBuoyancy[tankConfig]              // e.g. +2.8 for AL80
  return Math.max(0, Math.round(sum))                       // e.g. 12 lbs
}
```

### getBreakdown() Flow
Returns array of `{label, value}` objects for UI display:
```javascript
[
  { label: "Body buoyancy (fresh water)",     value: "+2.7 lbs" },
  { label: "BCD (Steel Backplate + Wing)",    value: "-3.5 lbs" },
  { label: "Wetsuit buoyancy (5mm)",          value: "+10 lbs"  },
  { label: "Tank buoyancy (single al)",       value: "+2.8 lbs" }
]
```
Uses `bcdLabels` lookup for human-readable BCD names.

### updateDisplay() Flow
```
1. Read DOM inputs: #bodyWeight, #wetsuitType, #bcdType, #tankConfig, #waterType, #currentLead
2. If isMetric, convert bodyWeight and currentLead from kg → lbs for calculation
3. Call calculate() → recommendedWeight
4. Calculate netBuoyancy for visual scale
5. Convert result back to kg if metric
6. Update #recommendedWeight text
7. Call drawBuoyancyScale() → SVG lever visualization
8. Call getBreakdown() → render breakdown items into #weightBreakdown
```

### drawBuoyancyScale() — SVG Visualization
Draws a balance/lever scale:
- Center fulcrum at neutral point
- Left side: "POSITIVE (ADD WEIGHT)" zone
- Right side: "NEGATIVE (REMOVE WEIGHT)" zone
- Animated diver icon on the lever
- Shows recommended weight vs current lead added
- Color coding: green (balanced), yellow (close), red (off)

### HTML Elements
`#bodyWeight`, `#bodyWeightUnit`, `#wetsuitType`, `#bcdType`, `#tankConfig`, `#waterType`, `#recommendedWeight`, `#weightUnit`, `#weightBreakdown`, `#currentLead`, `#weightVisualContainer`

---

## 7. GAS PLANNING (`gasplan.js` — 316 lines)

### Tank Configs (SEPARATE from tanks.js)
```javascript
tankConfigs: {
  'al80':           { volume: 77.4,  workingPressure: 3000, count: 1 },
  'hp100':          { volume: 100,   workingPressure: 3442, count: 1 },
  'doubles-lp85':   { volume: 170,   workingPressure: 2640, count: 2 },
  'doubles-hp100':  { volume: 200,   workingPressure: 3442, count: 2 },
  'sm-al80':        { volume: 154.8, workingPressure: 3000, count: 2 },
  'sm-al40':        { volume: 80,    workingPressure: 3000, count: 2 },
  'sm-lp85':        { volume: 170,   workingPressure: 2640, count: 2 },
  'sm-steel50':     { volume: 100,   workingPressure: 2640, count: 2 }
}
```
Note: For all multi-tank configs here, `volume` is TOTAL system volume.

### Rule of Thirds
```javascript
ruleOfThirds(startPressure) {
  third = startPressure / 3;
  return {
    penetration: round(third),      // 1/3 gas for going IN
    exit: round(third),             // 1/3 gas for coming OUT
    reserve: round(third),          // 1/3 EMERGENCY reserve
    turnaround: round(startPressure - third)  // PSI at turn point
  }
}
```

### Gas Volume at Pressure
```javascript
getGasAtPressure(tankConfig, pressure) {
  return (pressure / tank.workingPressure) × tank.volume  // ft³
}
```

### Minimum Gas Reserve (Emergency Calc)
```javascript
minGasReserve(depth, sacRate, tankCuft, tankPsi) {
  stressSac = sacRate × 2.5;           // 150% stress factor
  depthAta = (depth + 33) / 33;
  gasAtDepth = stressSac × depthAta × 1min;
  ascentTime = depth / 30;             // 30 ft/min ascent
  avgAscentAta = ((depth/2) + 33) / 33;
  gasAscent = stressSac × avgAscentAta × ascentTime;
  safetyStopAta = (15 + 33) / 33;      // 15ft stop
  gasSafetyStop = stressSac × safetyStopAta × 3min;
  totalGasCuft = gasAtDepth + gasAscent + gasSafetyStop;
  return round(totalGasCuft × (tankPsi / tankCuft));  // PSI
}
```

### updateDisplay() Flow
```
1. Read #startPressure, #gasPlanTankConfig
2. Calculate thirds
3. Update #thirdIn, #thirdOut, #thirdReserve, #turnaroundPressure
4. Call drawTankVisuals() → SVG
5. Calculate total gas in ft³ and liters
6. Sidemount: show per-tank breakdown + system total
   Doubles/Single: show total + usable (⅔)
7. Update unit labels (PSI/bar)
```

### drawTankVisuals() — SVG Technical Drawing
- Draws 1 or 2 tank outlines (steel=rounded bottom + boot, aluminum=flat bottom)
- DIN valve detail on top of each tank
- Gas fill levels clipped to tank shape:
  - Top third: cyan (penetration)
  - Middle third: green (exit)
  - Bottom third: red (reserve)
- Turn point line (dashed white)
- Doubles: manifold isolator bar + tank bands with bolt details
- Legend: "1/3 IN", "1/3 OUT", "RESERVE", "TURN ↩"

---

## 8. PENETRATION CALCULATOR (`penetration.js` — 340 lines)

### Tank Specs (SEPARATE from other modules)
```javascript
tankSpecs: {
  al80:             { volume: 77.4, workingPsi: 3000 },       // single
  hp100:            { volume: 100,  workingPsi: 3442 },       // single
  lp85:             { volume: 85,   workingPsi: 2640 },       // single
  'doubles-lp85':   { volume: 170,  workingPsi: 2640 },       // manifolded TOTAL
  'doubles-hp100':  { volume: 200,  workingPsi: 3442 },       // manifolded TOTAL
  'sm-al80':        { volume: 77.4, workingPsi: 3000 },       // PER TANK
  'sm-al40':        { volume: 40,   workingPsi: 3000 },       // PER TANK
  'sm-lp85':        { volume: 85,   workingPsi: 2640 },       // PER TANK
  'sm-steel50':     { volume: 50,   workingPsi: 2640 }        // PER TANK
}
```
⚠️ **Key difference**: Sidemount volumes here are PER TANK (not doubled), because `calculateGasVolume()` sums them from two separate pressure readings.

### Cert Limits
```javascript
certLimits: { cavern: 200, apprentice: 1000, full: Infinity }  // feet
```

### Gas Volume Calculation
```javascript
calculateGasVolume(tankType, p1, p2) {
  // DOUBLES (manifolded): average the two gauges, use total volume
  if (tankType.includes('doubles')) {
    avgP = (p2 > 0) ? (p1 + p2) / 2 : p1;
    return (avgP / workingPsi) × volume;  // volume is already total
  }
  // SIDEMOUNT or SINGLE: sum each tank independently
  total = (p1 / workingPsi) × volume;
  if (p2 > 0) total += (p2 / workingPsi) × volume;  // volume is per-tank
  return total;
}
```

### Main Calculation Flow
```javascript
calculate(yourData, partnerData, depth, swimSpeed, certLevel) {
  ata = (depth + 33) / 33;
  stressMultiplier = 1.5;

  // Gas available for each diver
  yourGas = calculateGasVolume(yourData.tankType, yourData.p1, yourData.p2);
  partnerGas = calculateGasVolume(partnerData.tankType, partnerData.p1, partnerData.p2);

  // Rule of thirds: usable gas = 1/3 of total
  yourUsable = yourGas / 3;
  partnerUsable = partnerGas / 3;

  // Gas consumption rates at depth
  yourRate = yourData.sac × ata;        // ft³/min at depth
  partnerRate = partnerData.sac × ata;

  // Individual turn times
  yourTime = yourUsable / yourRate;
  partnerTime = partnerUsable / partnerRate;

  // Limiting factor is whoever runs out first
  penetrationTime = Math.min(yourTime, partnerTime);

  // ROCK BOTTOM CHECK
  // At the turn, the buddy with less gas has 2/3 left
  // Both divers must exit sharing that 2/3 at stressed rates
  buddyGasAtTurn = Math.min(yourGas, partnerGas) × (2/3);
  sharedRate = (yourData.sac + partnerData.sac) × stressMultiplier × ata;
  maxSafeExitTime = buddyGasAtTurn / sharedRate;
  
  if (maxSafeExitTime < penetrationTime) {
    penetrationTime = maxSafeExitTime;  // Rock bottom is the limiter
  }

  maxDistance = penetrationTime × swimSpeed;

  // Cert limit cap
  if (maxDistance > certLimits[certLevel]) {
    maxDistance = certLimit;
  }

  return { maxDistance, penetrationTime, yourGas, partnerGas, limitingFactor, sharedRate };
}
```

### Emergency Calculation
```javascript
calculateEmergency(yourData, partnerData, depth, swimSpeed, testDistance) {
  // "What if we're at testDistance and need to exit sharing gas?"
  sharedRate = (yourSac + partnerSac) × 1.5 × ata;
  exitTime = testDistance / swimSpeed;
  gasNeeded = sharedRate × exitTime;
  gasAvailable = (2/3) × partnerGas;     // buddy's remaining gas
  canMakeIt = gasNeeded <= gasAvailable;
  marginPercent = ((gasAvailable - gasNeeded) / gasAvailable) × 100;
}
```

### updateDisplay() Flow
```
1. Read inputs for YOU (sac, tankType, tank1 pressure, tank2 pressure)
2. Read inputs for PARTNER (same fields)
3. Read depth, swimSpeed, certLevel
4. Call calculate() → result
5. Update #maxPenetration, #penDetails (time, limiting factor, gas amounts)
6. Slider logic:
   - #testDistSlider range set to max(result.maxDistance × 1.5, 500)
   - Call calculateEmergency() for slider position
   - Show emergency info: exit time, gas needed, gas available, STATUS
   - Status: ✅ SECURE / ⚠️ DANGEROUS / ❌ FATAL
7. Call drawPenetrationGraph() → SVG
```

### drawPenetrationGraph() — SVG Cave Visualization
- Dark cave passage background with limestone texture
- Safe zone (green tint) up to safe limit
- Danger zone (red tint) beyond safe limit
- "SAFE LIMIT" marker line (cyan dashed)
- Diver icon at current test distance
- Distance label with pulsing alarm if exceeding limit

### HTML Input IDs (two diver forms)
YOU: `#yourSac`, `#yourTankType`, `#yourTank1`, `#yourTank2`
PARTNER: `#partnerSac`, `#partnerTankType`, `#partnerTank1`, `#partnerTank2`
SHARED: `#penDepth`, `#swimSpeed`, `#penCertLevel`, `#testDistSlider`
OUTPUT: `#maxPenetration`, `#penDetails`, `#emergencyInfo`, `#penVisualContainer`, `#testDistValue`

---

## 9. SAC RATE CALCULATOR (`sac.js` — ~270 lines)

### Formulas
```javascript
ATA = (depth + 33) / 33

SAC (psi/min) = psiUsed / time / ATA
// Surface-normalized pressure consumption rate

RMV (ft³/min) = (psiUsed / workingPSI × tankVolume) / ATA / time
// Surface-normalized volume consumption rate (tank-independent)
```

### Internal Tank Data
```javascript
tanks: {
  al80:  { volume: 77.4,  workingPsi: 3000 },
  hp100: { volume: 100,   workingPsi: 3442 },
  lp85:  { volume: 85,    workingPsi: 2640 }
}
```

### Rating System (RMV thresholds)
```javascript
< 0.4  → "Excellent" (green)
< 0.6  → "Good" (green)
< 0.8  → "Average" (yellow)
< 1.0  → "Above Average" (orange)
≥ 1.0  → "High" (red)
```

### updateDisplay() Flow
```
1. Read #sacTankType, #sacStartPsi, #sacEndPsi, #sacDepth, #sacTime
2. If metric, convert pressure from bar→PSI, depth from m→ft
3. Calculate psiUsed = start - end
4. Calculate ATA, SAC, RMV
5. Display results with rating color
6. Draw gauge visualization (SVG)
```

---

## 10. NITROX CALCULATOR (`nitrox.js` — ~270 lines)

### Formulas
```javascript
// Maximum Operating Depth (default PO2 1.4 for deco, 1.6 contingency)
MOD = ((PO2max / FO2) - 1) × 33     // result in fsw

// Best Mix for a given depth
BestMix = PO2max / ATA × 100         // result in %O2

// Equivalent Air Depth
EAD = ((1 - FO2) / 0.79) × (depth + 33) - 33   // result in fsw

// Partial Pressure of O2
PO2 = FO2 × ATA
```

### PO2 Status Thresholds
```javascript
< 1.2  → "safe" (green)
≤ 1.4  → "caution" (yellow)
> 1.4  → "danger" (red)
```

### Three Sub-Calculators in One Section
1. **MOD Calculator**: Input O2%, shows MOD at PO2 1.4 and 1.6
2. **Best Mix**: Input depth, shows optimal O2% for PO2 1.4
3. **EAD Calculator**: Input depth + O2%, shows equivalent air depth

### updateDisplay Functions
- `updateO2Display()` — calculates MOD from #o2Percent
- `updateBestMix()` — calculates best mix from #bestMixDepth
- `updateEAD()` — calculates EAD from #eadDepth + #eadO2
- `updatePO2()` — calculates PO2 from #po2Depth + #po2O2

---

## 11. PO2 TABLE (`po2table.js` — 49 lines)

### Config
```javascript
mixes: [21, 28, 32, 36, 40]    // %O2
depths: [0, 33, 50, 66, 80, 100, 110, 130, 140, 165]   // feet
```

### generateTable()
```
1. Create header row: "Depth (ft/m)" | "ATA" | each mix %
2. For each depth:
   - displayDepth = isMetric ? round(depthFeet × 0.3048) : depthFeet
   - ata = (depthFeet + 33) / 33
   - For each mix: PO2 = (mix/100) × ata
   - Cell class: safe / caution / danger
3. Write to #po2Table innerHTML
```

---

## 12. EQUIPMENT CHECKLIST (`checklist.js` — 192 lines)

### Categories & Items
```javascript
checklists: {
  sidemount: { name: 'Sidemount Configuration', icon: '🤿', items: [8 items] },
  gas:       { name: 'Gas System', icon: SVG, items: [8 items] },
  regs:      { name: 'Regulators Check', icon: '⚙️', items: [7 items] },
  lights:    { name: 'Lights Check', icon: '🔦', items: [7 items] },
  line:      { name: 'Line & Navigation', icon: '🧵', items: [7 items] },
  buddy:     { name: 'Buddy Check', icon: '👥', items: [7 items] }
}
```

Each item: `{ id: 'sm1', text: 'Harness adjusted and snug', critical: true }`

### State Management
```javascript
completedItems: {}   // { 'sm1': true, 'sm2': false, ... }

loadState()  → reads from localStorage key 'caveDiveChecklist'
saveState()  → writes to localStorage
toggleItem(id) → flip boolean, save, re-render
resetAll()   → clear all, save, re-render
```

### render() Flow
```
For each category:
  1. Calculate progress (completed/total, percent)
  2. Render card with progress bar
  3. Render each item as clickable <li>
     - .checked class if completed
     - .critical class + badge if critical
     - onclick → toggleItem(id)
```

---

## 13. CSS ARCHITECTURE (`styles/main.css`)

### Theme Colors
```css
--bg-primary:     #0a1220    (dark navy)
--bg-secondary:   #111827    (slightly lighter)
--bg-card:        #1a2332    (card backgrounds)
--accent-primary: #00d4ff    (cyan - primary accent)
--accent-green:   #00ff88    (success/safe)
--accent-red:     #ff4466    (danger)
--text-primary:   #e2e8f0    (light gray text)
--text-secondary: #8892a6    (muted text)
```

### Layout
- Sidebar: fixed left, 240px wide, scrollable nav
- Main content: margin-left to clear sidebar
- Cards: `.calc-card` with glassmorphism (backdrop-filter: blur)
- Grid: `.calc-grid`, `.form-grid` — responsive CSS grid
- Mobile: sidebar collapses, hamburger menu

### Key CSS Classes
- `.calculator-section` — hidden by default, `.active` shows it
- `.calc-card` — glassmorphism card with border
- `.result-card` — highlighted result card
- `.input-wrapper` — form field with label + input + unit span
- `.nav-link.active` — highlighted nav item
- `.safe`, `.caution`, `.danger` — status colors (used in tables, alerts)

---

## 14. COMMON PATTERNS ACROSS ALL MODULES

### Module Structure (every module follows this)
```javascript
const ModuleName = {
  // 1. Configuration/data properties
  someData: { ... },

  // 2. Pure calculation functions (no DOM)
  calculate(...) { return result; },

  // 3. UI rendering (reads DOM → calls calculate → writes DOM)
  updateDisplay() { ... },

  // 4. SVG visualization (optional)
  drawVisual(containerId, ...) { ... },

  // 5. Initialization (bind events, initial render)
  init() {
    // Bind input/change listeners to relevant DOM elements
    // Call updateDisplay() for initial render
  }
};
window.ModuleName = ModuleName;
```

### ATA Formula (used in gasplan, penetration, sac, nitrox, po2table)
```javascript
ATA = (depthFeet + 33) / 33   // seawater: 33 fsw per atmosphere
```

### Metric Conversion Pattern
```javascript
// In updateDisplay():
const isMetric = window.App?.isMetric || false;
let value = parseFloat(input.value);
if (isMetric) value = value / conversionFactor;  // convert to imperial
// ... do all math in imperial ...
const displayValue = isMetric ? result * conversionFactor : result;
```

---

## 15. DESIGN DECISIONS & GOTCHAS

1. **Three separate tank config objects** exist in `tanks.js`, `gasplan.js`, and `penetration.js`. They serve different purposes and are NOT shared. Don't try to unify them without understanding why they differ.

2. **Sidemount volume difference**: In `gasplan.js`, sidemount volumes are TOTAL (both tanks). In `penetration.js`, they are PER TANK because each tank has its own pressure reading.

3. **No build system** — edit files directly, refresh browser. No npm, no bundler.

4. **No backend** — all client-side. Checklist uses localStorage only.

5. **Imperial-first math** — NEVER do calculations in metric. Convert inputs to imperial, calculate, convert output back.

6. **Seawater column = 33 fsw** (not 34). This is consistent across ALL modules.

7. **Tank buoyancy = seawater values** from manufacturer specs. These are the standard reference values even for fresh water calculations.

8. **Weight calculator uses END-of-dive (empty) tank buoyancy** because that's worst case for ascent — you must be able to achieve neutral buoyancy with empty tanks.

9. **`lp104` was renamed to `lp108`** (Feb 2026) — Faber doesn't make an LP104. If you see lp104 references anywhere, they're bugs.

10. **`sm_50` vs `sm50`** — The tank key in `tanks.js` is `sm50` (no underscore). The `getTank()` function strips `sm_` prefix, so `sm_50` would try to find key `50` which doesn't exist and falls back to hp100. Always use `sm50` for the Steel 50 tank.

---

## 16. REVISION HISTORY

### Feb 12, 2026 — Weight Calculator Accuracy Overhaul
- Fixed HP120, HP80, SM50 buoyancy values in `tanks.js`
- Renamed `lp104` → `lp108` in `tanks.js` + `index.html`
- Fixed `sm_50` → `sm50` reference in `index.html`
- Overhauled `weights.js`: body buoyancy (2.5%→1.5% fresh), wetsuit values (doubled+), added BCD type selector
- BCD options: Steel BP+Wing (-3.5), Aluminum BP+Wing (+1.5), Xdeep Tec 2.0 (+1.5), Dive Rite Ray (+1.5), Hollis Katana 2 (+1.5)
- All other calculators audited and confirmed accurate

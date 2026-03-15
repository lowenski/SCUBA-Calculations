/**
 * Weight Calculator Module
 * Calculate ballast weight needed for neutral buoyancy
 * 
 * Methodology (based on industry best practices):
 *   1. Body Buoyancy: ~1.5% (fresh) / ~4.0% (salt) of body weight
 *      - Human body is nearly neutral in fresh water (avg density ≈ 1.01-1.05)
 *      - Saltwater is ~2.5% denser, increasing buoyancy significantly
 *   2. BCD/Harness Buoyancy: varies by configuration
 *      - Steel backplate + wing ≈ -3.5 lbs net (plate sinks, reduces lead needed)
 *      - Aluminum backplate + wing ≈ +1.5 lbs net (plate nearly neutral)
 *      - Sidemount harness ≈ +1.5 lbs net (Xdeep Tec 2.0, Dive Rite Ray, Hollis Katana 2)
 *   3. Wetsuit Buoyancy: major contributor — neoprene contains air bubbles
 *   4. Tank Buoyancy at END of dive (empty ≈ 500 PSI) determines weighting
 *      - Positive = tank floats = need MORE weight
 *      - Negative = tank sinks = need LESS weight
 *   5. Total = Body + BCD + Wetsuit + Tank
 * 
 * Sources: sportalsub.net, aquaworld.com.mx, scubadiving.com,
 *          Faber spec sheets, DiveGearExpress, divers-supply.com,
 *          halcyon.net, xdeep.eu, diverite.com, hollis.com
 */

const WeightCalculator = {
    // Wetsuit buoyancy values (lbs of lift at surface)
    // Sources: wetsuitwearhouse.com, scubadiving.com, aquaworld.com.mx, sportalsub.net
    // These represent the buoyant lift the suit creates that must be counteracted
    wetsuitBuoyancy: {
        none: 0,           // Skin/rashguard: ~0-2 lbs, use 0 for "none"
        '3mm': 5,          // 3mm shorty/full: 4-6 lbs typical
        '5mm': 10,         // 5mm full suit: 8-12 lbs typical
        '7mm': 16,         // 7mm + hood + boots: 14-18 lbs typical
        drysuit: 18        // Shell drysuit + medium undergarments: 16-22 lbs
    },

    // BCD / Harness net buoyancy when fully deflated (lbs)
    // Net effect = backplate negative buoyancy + wing/bladder inherent positive buoyancy
    // Sources: halcyon.net, divegearexpress.com, xdeep.eu, diverite.com, hollis.com
    bcdBuoyancy: {
        // Backmount: Steel backplate (~6 lbs in air, ~-5 lbs in water) + wing bladder (~+1.5 lbs)
        'bp-steel': -3.5,       // Steel BP + wing: plate sinks, net ≈ -3.5 lbs (reduces lead!)
        // Backmount: Aluminum backplate (~2 lbs, nearly neutral) + wing bladder (~+1.5 lbs)
        'bp-aluminum': 1.5,     // Aluminum BP + wing: plate ~neutral, net ≈ +1.5 lbs
        // Sidemount harnesses: no heavy backplate, just harness + deflated bladder
        'sm-xdeep': 1.5,        // Xdeep Stealth Tec 2.0: dry wt 4 lbs, minimal inherent buoyancy
        'sm-diverite': 1.5,     // Dive Rite Ray: dry wt 5.7 lbs, minimal inherent buoyancy
        'sm-katana': 1.5         // Hollis Katana 2: dry wt 9.5 lbs, minimal inherent buoyancy
    },

    // Tank configuration buoyancy (lbs at END of dive / Empty @ ~500 PSI, in seawater)
    // CRITICAL: Weighting must be based on end-of-dive buoyancy for safe ascent/safety stops
    // Sources: Faber spec sheets via divegearexpress.com, divers-supply.com, catalinacylinders.com
    // Positive value = tank floats when empty = need MORE weight
    // Negative value = tank sinks when empty = need LESS weight
    tankConfigBuoyancy: {
        // Backmount Single
        'single-al': 2.8,          // AL80 Catalina Empty: +2.8 lbs
        'single-steel': -0.59,     // Faber HP100 Empty: -0.59 lbs
        // Backmount Doubles (×2)
        'doubles-lp': 4.64,        // 2× Faber LP85 Empty: +2.32 each = +4.64 total
        'doubles-hp': -1.18,       // 2× Faber HP100 Empty: -0.59 each = -1.18 total
        // Sidemount (×2 tanks)
        'sidemount-al80': 5.6,     // 2× AL80 Catalina Empty: +2.8 each = +5.6 total
        'sidemount-al40': 4.8,     // 2× AL40 Empty: +2.4 each = +4.8 total
        'sidemount-lp85': 4.64,    // 2× Faber LP85 Empty: +2.32 each = +4.64 total
        'sidemount-steel50': 2.48  // 2× Faber Steel 50 Empty: +1.24 each = +2.48 total
    },

    // Body buoyancy multiplier
    // Average human body density ≈ 1.01-1.05 g/cm³ in fresh water (slightly negative or neutral)
    // In salt water (density ≈ 1.025), bodies become significantly more buoyant
    // Sources: NIH body density studies, scubadiving.com, sportalsub.net
    baseMultiplier: {
        fresh: 0.015,   // ~1.5% of body weight — body is nearly neutral in fresh
        salt: 0.04      // ~4% of body weight — saltwater makes you significantly more buoyant
    },

    // Calculate recommended weight
    calculate(bodyWeight, wetsuitType, tankConfig, waterType, bcdType) {
        // 1. Body buoyancy
        const baseBuoyancy = bodyWeight * this.baseMultiplier[waterType];

        // 2. BCD net buoyancy (negative = helps you sink = need LESS lead)
        const bcdLift = this.bcdBuoyancy[bcdType] || 1.5;

        // 3. Wetsuit compensation
        const wetsuitLift = this.wetsuitBuoyancy[wetsuitType] || 0;

        // 4. Tank buoyancy at end of dive (positive = floats = need MORE weight)
        const tankBuoyancy = this.tankConfigBuoyancy[tankConfig] || 0;

        // Total weight needed = everything that makes you float
        const totalWeight = baseBuoyancy + bcdLift + wetsuitLift + tankBuoyancy;

        // Minimum of 0 (steel backplate + steel doubles in fresh may need very little)
        return Math.max(0, Math.round(totalWeight));
    },

    // Get breakdown of weight calculation
    getBreakdown(bodyWeight, wetsuitType, tankConfig, waterType, bcdType) {
        const isMetric = window.App?.isMetric || false;
        const unit = isMetric ? 'kg' : 'lbs';
        const conversionFactor = isMetric ? 0.453592 : 1;

        const base = bodyWeight * this.baseMultiplier[waterType];
        const bcd = this.bcdBuoyancy[bcdType] || 1.5;
        const wetsuit = this.wetsuitBuoyancy[wetsuitType] || 0;
        const tank = this.tankConfigBuoyancy[tankConfig] || 0;

        // Format BCD label based on type
        const bcdLabels = {
            'bp-steel': 'Steel Backplate + Wing',
            'bp-aluminum': 'Aluminum Backplate + Wing',
            'sm-xdeep': 'Xdeep Tec 2.0',
            'sm-diverite': 'Dive Rite Ray',
            'sm-katana': 'Hollis Katana 2'
        };
        const bcdLabel = bcdLabels[bcdType] || 'BCD';

        return [
            {
                label: `Body buoyancy (${waterType} water)`,
                value: `+${UnitConverter.round(base * conversionFactor, 1)} ${unit}`
            },
            {
                label: `BCD (${bcdLabel})`,
                value: `${bcd >= 0 ? '+' : ''}${UnitConverter.round(bcd * conversionFactor, 1)} ${unit}`
            },
            {
                label: `Wetsuit buoyancy (${wetsuitType})`,
                value: `+${UnitConverter.round(wetsuit * conversionFactor, 1)} ${unit}`
            },
            {
                label: `Tank buoyancy (${tankConfig.replace(/-/g, ' ')})`,
                value: `${tank >= 0 ? '+' : ''}${UnitConverter.round(tank * conversionFactor, 1)} ${unit}`
            }
        ];
    },

    // Draw Buoyancy Scale Visualization (Technical Manual Style)
    drawBuoyancyScale(containerId, netBuoyancy, recommendedWeight, currentLead) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = 280;
        const height = 180;
        const scaleTop = 30;
        const scaleBottom = 150;
        const scaleHeight = scaleBottom - scaleTop;
        const neutralY = scaleTop + (scaleHeight / 2);

        // Effective Buoyancy = Net (Unweighted) - Lead Added
        const effectiveBuoyancy = netBuoyancy - currentLead;

        // Max range +/- 15 lbs for visual scaling to keep it sensitive
        const maxRange = 15;
        const clampedBuoyancy = Math.max(-maxRange, Math.min(maxRange, effectiveBuoyancy));
        // Invert Y: Positive (Float) = UP, Negative (Sink) = DOWN
        const percentOffset = clampedBuoyancy / maxRange;
        const diverY = neutralY - (percentOffset * (scaleHeight / 2));

        const isMetric = window.App?.isMetric || false;
        const unit = isMetric ? 'kg' : 'lbs';
        const displayBuoyancy = Math.round(isMetric ? Math.abs(effectiveBuoyancy) * 0.453592 : Math.abs(effectiveBuoyancy));

        // Status text
        let statusText = "NEUTRAL (PERFECT)";
        let statusColor = "#00ff9d"; // green
        if (effectiveBuoyancy > 1) {
            statusText = "POSITIVE (ADD WEIGHT)";
            statusColor = "#ffb800"; // yellow
        } else if (effectiveBuoyancy < -1) {
            statusText = "NEGATIVE (REMOVE WEIGHT)";
            statusColor = "#ef4444"; // red
        }

        // Colors
        const cStroke = '#00f3ff';
        const cFill = 'rgba(0, 243, 255, 0.15)';
        const cGrid = 'rgba(255, 255, 255, 0.05)';
        const cNeutral = '#00ff9d';

        // Diver scale factor (smaller to fit the compact viewBox)
        const ds = 0.6;

        container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
            <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="${cGrid}" stroke-width="1"/>
                </pattern>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="${statusColor}" />
                </marker>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            <!-- Background Grid -->
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Neutral Line -->
            <line x1="15" y1="${neutralY}" x2="${width - 15}" y2="${neutralY}" stroke="${cNeutral}" stroke-width="1" stroke-dasharray="5,3" opacity="0.5"/>
            <text x="${width - 18}" y="${neutralY - 6}" fill="${cNeutral}" font-family="monospace" font-size="8" text-anchor="end" font-weight="bold">NEUTRAL</text>

            <!-- Vertical Scale Axis -->
            <line x1="30" y1="${scaleTop}" x2="30" y2="${scaleBottom}" stroke="#334155" stroke-width="1" />
            <text x="26" y="${scaleTop + 2}" fill="#64748b" font-size="7" font-family="monospace" text-anchor="end">+</text>
            <text x="26" y="${scaleBottom}" fill="#64748b" font-size="7" font-family="monospace" text-anchor="end">−</text>

            <!-- Technical Diver Entity (scaled down) -->
            <g transform="translate(${width / 2 - 50}, ${diverY - 12 * ds}) scale(${ds})" style="transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);">
                <g filter="url(#glow)">
                    <!-- Body & BCD -->
                    <path d="M0,15 C5,5 25,2 45,5 L110,5 C120,5 130,10 130,20 C130,30 120,35 110,35 L45,35 C25,38 5,35 0,25 Z" fill="${cFill}" stroke="${cStroke}" stroke-width="1.5"/>
                    <!-- Backmount Tanks -->
                    <rect x="35" y="-2" width="60" height="12" rx="3" fill="#1e293b" stroke="${cStroke}" stroke-width="1"/>
                    <rect x="35" y="25" width="60" height="12" rx="3" fill="#1e293b" stroke="${cStroke}" stroke-width="1"/>
                    <!-- Fins -->
                    <path d="M125,20 L145,8 L152,20 L145,32 Z" fill="${cFill}" stroke="${cStroke}" stroke-width="1.5"/>
                    <!-- Mask -->
                    <circle cx="-5" cy="18" r="7" fill="${cFill}" stroke="${cStroke}" stroke-width="1.5"/>
                    ${currentLead > 0 ? `<rect x="60" y="32" width="12" height="8" fill="#f59e0b" rx="2" stroke="#fff" stroke-width="0.5" />` : ''}
                </g>
                <circle cx="-2" cy="10" r="3" fill="rgba(255,255,255,0.3)">
                    <animate attributeName="cy" from="10" to="-60" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
                </circle>
            </g>

            <!-- Dynamic Force Indicator -->
            <g transform="translate(${width - 40}, ${diverY})">
                ${Math.abs(effectiveBuoyancy) > 0.5 ? `
                    <line x1="0" y1="0" x2="0" y2="${clampedBuoyancy * -3}" stroke="${statusColor}" stroke-width="2" marker-end="url(#arrowhead)"/>
                    <text x="8" y="${clampedBuoyancy * -1.5}" fill="${statusColor}" font-size="9" font-family="monospace" font-weight="bold">${effectiveBuoyancy > 0 ? '+' : ''}${displayBuoyancy} ${unit}</text>
                ` : `
                    <circle r="4" fill="${cNeutral}" filter="url(#glow)"/>
                    <text x="8" y="3" fill="${cNeutral}" font-size="8" font-family="monospace" font-weight="bold">NEUTRAL</text>
                `}
            </g>

            <!-- Status HUD -->
            <text x="8" y="${height - 6}" fill="${statusColor}" font-size="8" font-family="monospace" font-weight="bold" letter-spacing="0.5">
                ${statusText}
            </text>
        </svg>
        `;
    },

    updateDisplay() {
        const bodyWeightInput = document.getElementById('bodyWeight');
        const wetsuitSelect = document.getElementById('wetsuitType');
        const bcdSelect = document.getElementById('bcdType');
        const tankConfigSelect = document.getElementById('tankConfig');
        const waterTypeSelect = document.getElementById('waterType');
        const resultDisplay = document.getElementById('recommendedWeight');
        const breakdownDisplay = document.getElementById('weightBreakdown');
        const weightUnitDisplay = document.getElementById('weightUnit');
        const currentLeadInput = document.getElementById('currentLead');

        if (!bodyWeightInput || !resultDisplay) return;

        const isMetric = window.App?.isMetric || false;
        let bodyWeight = parseFloat(bodyWeightInput.value) || 180;
        let currentLead = parseFloat(currentLeadInput?.value) || 0;

        // Convert inputs from metric if needed
        if (isMetric) {
            bodyWeight = bodyWeight / 0.453592;
            currentLead = currentLead / 0.453592;
        }

        const wetsuitType = wetsuitSelect?.value || '5mm';
        const bcdType = bcdSelect?.value || 'bp-steel';
        const tankConfig = tankConfigSelect?.value || 'single-al';
        const waterType = waterTypeSelect?.value || 'fresh';

        const recommendedWeight = this.calculate(bodyWeight, wetsuitType, tankConfig, waterType, bcdType);

        // Calculate Unweighted Buoyancy (includes BCD)
        const baseBuoyancy = bodyWeight * this.baseMultiplier[waterType];
        const bcdLift = this.bcdBuoyancy[bcdType] || 1.5;
        const wetsuitLift = this.wetsuitBuoyancy[wetsuitType] || 0;
        const tankBuoyancy = this.tankConfigBuoyancy[tankConfig] || 0;
        const netBuoyancy = baseBuoyancy + bcdLift + wetsuitLift + tankBuoyancy;

        const displayWeight = isMetric ? recommendedWeight * 0.453592 : recommendedWeight;
        const unit = isMetric ? 'kg' : 'lbs';

        resultDisplay.textContent = UnitConverter.round(displayWeight, 0);
        if (weightUnitDisplay) {
            weightUnitDisplay.textContent = unit;
        }

        // VISUAL: Pass currentLead so visual shows the EFFECT of the weight
        this.drawBuoyancyScale('weightVisualContainer', netBuoyancy, recommendedWeight, currentLead);

        // Update breakdown
        if (breakdownDisplay) {
            const breakdown = this.getBreakdown(bodyWeight, wetsuitType, tankConfig, waterType, bcdType);
            breakdownDisplay.innerHTML = breakdown.map(item => `
                <div class="weight-breakdown-item">
                    <span>${item.label}</span>
                    <span>${item.value}</span>
                </div>
            `).join('');
        }
    },

    init() {
        const inputs = [
            'bodyWeight',
            'wetsuitType',
            'bcdType',
            'tankConfig',
            'waterType',
            'currentLead'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateDisplay());
                element.addEventListener('change', () => this.updateDisplay());
            }
        });

        // Apply Button Logic
        const applyBtn = document.getElementById('applyRecWeight');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const recommended = document.getElementById('recommendedWeight').textContent;
                const leadInput = document.getElementById('currentLead');
                if (leadInput) {
                    leadInput.value = recommended;
                    // Trigger update
                    this.updateDisplay();
                }
            });
        }

        // Initial calculation
        this.updateDisplay();
    }
};

window.WeightCalculator = WeightCalculator;

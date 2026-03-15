/**
 * Gas Planning Module
 * Rule of Thirds calculations for cave diving
 */

const GasPlan = {
    // Tank configurations with gas volume and working pressure
    tankConfigs: {
        // Backmount Single
        'al80': { name: 'AL80', volume: 77.4, workingPressure: 3000, count: 1 },
        'hp100': { name: 'HP100', volume: 100, workingPressure: 3442, count: 1 },
        // Backmount Doubles
        'doubles-lp85': { name: 'LP85 Doubles', volume: 170, workingPressure: 2640, count: 2 },
        'doubles-hp100': { name: 'HP100 Doubles', volume: 200, workingPressure: 3442, count: 2 },
        // Sidemount
        'sm-al80': { name: 'AL80 Sidemount', volume: 154.8, workingPressure: 3000, count: 2 },
        'sm-al40': { name: 'AL40 Sidemount', volume: 80, workingPressure: 3000, count: 2 },
        'sm-lp85': { name: 'LP85 Sidemount', volume: 170, workingPressure: 2640, count: 2 },
        'sm-steel50': { name: 'Steel 50 Sidemount', volume: 100, workingPressure: 2640, count: 2 }
    },

    // Calculate rule of thirds
    ruleOfThirds(startPressure) {
        const third = startPressure / 3;
        return {
            penetration: Math.round(third),
            exit: Math.round(third),
            reserve: Math.round(third),
            turnaround: Math.round(startPressure - third)
        };
    },

    // Calculate gas volume at pressure
    getGasAtPressure(tankConfig, pressure) {
        const tank = this.tankConfigs[tankConfig];
        if (!tank) return 0;
        return (pressure / tank.workingPressure) * tank.volume;
    },

    // Calculate minimum gas reserve for emergency
    // Based on ascent from depth at increased SAC rate
    minGasReserve(depth, sacRate, tankCuft, tankPsi) {
        const stressSac = sacRate * 2.5;
        const depthAta = (depth + 33) / 33;
        const timeAtDepth = 1;
        const gasAtDepth = stressSac * depthAta * timeAtDepth;
        const ascentTime = depth / 30;
        const avgAscentAta = ((depth / 2) + 33) / 33;
        const gasAscent = stressSac * avgAscentAta * ascentTime;
        const safetyStopAta = (15 + 33) / 33;
        const gasSafetyStop = stressSac * safetyStopAta * 3;
        const totalGasCuft = gasAtDepth + gasAscent + gasSafetyStop;
        const psiPerCuft = tankPsi / tankCuft;
        return Math.round(totalGasCuft * psiPerCuft);
    },

    // Draw visual representation of gas plan (Technical Manual Style)
    drawTankVisuals(containerId, tankConfig, startPressure, thirds) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const tank = this.tankConfigs[tankConfig];
        if (!tank) return;

        // Configuration flags
        const tankCount = tank.count;
        const isDoubles = tankConfig.includes('doubles');
        const isSidemount = tankConfig.includes('sm-');
        const isSteel = tankConfig.includes('steel') || tankConfig.includes('hp') || tankConfig.includes('lp');

        // Clear container
        container.innerHTML = '';
        container.className = 'tank-visual-container tech-drawing'; // Add class for CSS styling if needed

        // SVG Dimensions
        const w = 300; // Wider canvas for doubles/sidemount
        const h = 400;

        // Tank Dimensions
        const tWidth = 80;
        const tHeight = 240;
        const tX = isDoubles ? 60 : (isSidemount ? 40 : 110); // Center start
        const tGap = 100; // Gap for doubles/sidemount

        // Colors (Technical Blueprint Style)
        const cStroke = '#00d4ff'; // Cyan outlines
        const cFill = '#0a1220';   // Dark blue background (matches app bg)
        const cGasPen = 'rgba(0, 212, 255, 0.2)';
        const cGasExit = 'rgba(0, 255, 136, 0.2)';
        const cGasRes = 'rgba(255, 68, 102, 0.2)';

        // SVG Construction
        let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
            <defs>
                <!-- Steel Tank Shape (Round bottom with Boot) -->
                <path id="tankSteel" d="M0,20 Q0,0 40,0 Q80,0 80,20 V${tHeight - 20} Q80,${tHeight} 40,${tHeight} Q0,${tHeight} 0,${tHeight - 20} Z" />
                
                <!-- Aluminum Tank Shape (Flat bottom) -->
                <path id="tankAl80" d="M0,20 Q0,0 40,0 Q80,0 80,20 V${tHeight} H0 Z" />
                
                <!-- Tank Boot Detail (for Steel) -->
                <path id="tankBoot" d="M0,${tHeight - 30} H80 V${tHeight - 20} Q80,${tHeight} 40,${tHeight} Q0,${tHeight} 0,${tHeight - 20} Z" fill="none" stroke="${cStroke}" stroke-width="1" stroke-dasharray="2,2"/>

                <!-- DIN Valve Detail -->
                <g id="valveDIN">
                    <!-- Valve Body -->
                    <rect x="25" y="-35" width="30" height="35" rx="2" fill="${cFill}" stroke="${cStroke}" stroke-width="2"/>
                    <!-- Handwheel (Knob) -->
                    <path d="M55,-25 H70 V-5 H55 Z" fill="${cFill}" stroke="${cStroke}" stroke-width="2"/>
                    <line x1="60" y1="-25" x2="60" y2="-5" stroke="${cStroke}" stroke-width="1"/>
                    <line x1="65" y1="-25" x2="65" y2="-5" stroke="${cStroke}" stroke-width="1"/>
                    <!-- DIN Connection -->
                    <circle cx="40" cy="-18" r="8" fill="none" stroke="${cStroke}" stroke-width="2"/>
                    <circle cx="40" cy="-18" r="3" fill="${cStroke}"/>
                </g>
                
                <!-- Manifold Isolator -->
                <g id="manifoldIso">
                    <rect x="-10" y="-25" width="20" height="10" fill="${cFill}" stroke="${cStroke}" stroke-width="2"/>
                    <circle cx="0" cy="-20" r="3" fill="${cStroke}"/>
                    <line x1="-50" y1="-20" x2="50" y2="-20" stroke="${cStroke}" stroke-width="4" stroke-linecap="round"/>
                </g>
            </defs>`;

        // Draw Tanks
        const tankShapeId = isSteel ? '#tankSteel' : '#tankAl80';

        // Loop for 1 or 2 tanks
        for (let i = 0; i < tankCount; i++) {
            const xPos = tX + (i * tGap);
            const yPos = 80; // Offset from top

            // 1. Tank Group
            svgContent += `<g transform="translate(${xPos}, ${yPos})">`;

            // Tank Body Outline
            svgContent += `<use href="${tankShapeId}" fill="${cFill}" stroke="${cStroke}" stroke-width="2"/>`;
            if (isSteel) {
                svgContent += `<use href="#tankBoot" />`;
            }

            // Gas Fill Levels (Masked by Tank Shape)
            // Clip Path
            const clipId = `clip${i}`;
            svgContent += `<clipPath id="${clipId}"><use href="${tankShapeId}"/></clipPath>`;

            const fillHeight = tHeight;
            const hPen = fillHeight * (1 / 3);
            const hExit = fillHeight * (1 / 3);
            const hRes = fillHeight * (1 / 3);

            svgContent += `<g clip-path="url(#${clipId})">
                <!-- Reserve (Bottom) -->
                <rect x="0" y="${fillHeight - hRes}" width="${tWidth}" height="${hRes}" fill="${cGasRes}" />
                <!-- Exit (Middle) -->
                <rect x="0" y="${fillHeight - hRes - hExit}" width="${tWidth}" height="${hExit}" fill="${cGasExit}" />
                <!-- Penetration (Top) -->
                <rect x="0" y="0" width="${tWidth}" height="${hPen}" fill="${cGasPen}" />
                
                <!-- Turn Point Line -->
                <line x1="0" y1="${hPen}" x2="${tWidth}" y2="${hPen}" stroke="#fff" stroke-width="2" stroke-dasharray="4,2"/>
            </g>`;

            // Valve
            svgContent += `<use href="#valveDIN" />`;

            svgContent += `</g>`; // End Tank Group
        }

        // Draw Manifold (if Doubles)
        if (isDoubles) {
            const mx = tX + (tGap / 2) + (tWidth / 2);
            svgContent += `<g transform="translate(${mx}, 80)">
                <use href="#manifoldIso" />
            </g>`;

            // Tank Bands
            const bandY1 = 140;
            const bandY2 = 260;
            svgContent += `
                <rect x="${tX}" y="${bandY1}" width="${tGap + tWidth}" height="20" fill="none" stroke="${cStroke}" stroke-width="1" rx="2" opacity="0.5"/>
                <rect x="${tX}" y="${bandY2}" width="${tGap + tWidth}" height="20" fill="none" stroke="${cStroke}" stroke-width="1" rx="2" opacity="0.5"/>
                <!-- Bolt Detail -->
                <circle cx="${tX + (tGap / 2) + 40}" cy="${bandY1 + 10}" r="3" fill="${cFill}" stroke="${cStroke}" />
                <circle cx="${tX + (tGap / 2) + 40}" cy="${bandY2 + 10}" r="3" fill="${cFill}" stroke="${cStroke}" />
            `;
        }

        // Labels
        svgContent += `
            <g transform="translate(${w - 60}, ${h / 2})" font-family="monospace" font-size="12" fill="#8892a6">
                <!-- Legend -->
                <rect x="0" y="-40" width="10" height="10" fill="${cGasPen}" stroke="${cStroke}"/> <text x="15" y="-31">1/3 IN</text>
                <rect x="0" y="-20" width="10" height="10" fill="${cGasExit}" stroke="${cStroke}"/> <text x="15" y="-11">1/3 OUT</text>
                <rect x="0" y="0" width="10" height="10" fill="${cGasRes}" stroke="${cStroke}"/> <text x="15" y="9">RESERVE</text>
            </g>
            
            <!-- Turn Marker Text -->
            <text x="${tX - 10}" y="${80 + (tHeight / 3)}" text-anchor="end" fill="#fff" font-size="12" font-weight="bold">TURN ↩</text>
        `;

        svgContent += `</svg>`;
        container.innerHTML = svgContent;
    },

    updateDisplay() {
        const startPressureInput = document.getElementById('startPressure');
        const tankConfigSelect = document.getElementById('gasPlanTankConfig');
        const thirdInDisplay = document.getElementById('thirdIn');
        const thirdOutDisplay = document.getElementById('thirdOut');
        const thirdReserveDisplay = document.getElementById('thirdReserve');
        const turnaroundDisplay = document.getElementById('turnaroundPressure');
        const totalGasDisplay = document.getElementById('totalGasDisplay');

        if (!startPressureInput) return;

        const isMetric = window.App?.isMetric || false;
        let startPressure = parseFloat(startPressureInput.value) || 3000;
        const tankConfig = tankConfigSelect?.value || 'al80';
        const tank = this.tankConfigs[tankConfig];

        // Calculate thirds
        const thirds = this.ruleOfThirds(startPressure);

        if (thirdInDisplay) thirdInDisplay.textContent = thirds.penetration;
        if (thirdOutDisplay) thirdOutDisplay.textContent = thirds.exit;
        if (thirdReserveDisplay) thirdReserveDisplay.textContent = thirds.reserve;
        if (turnaroundDisplay) turnaroundDisplay.textContent = thirds.turnaround;

        // Draw visuals
        this.drawTankVisuals('gasVisualContainer', tankConfig, startPressure, thirds);

        // Calculate total gas
        if (totalGasDisplay && tank) {
            const totalGasCuFt = this.getGasAtPressure(tankConfig, startPressure);
            const totalGasLiters = totalGasCuFt * 28.3168;
            const usableGasCuFt = this.getGasAtPressure(tankConfig, thirds.penetration + thirds.exit);
            const usableGasLiters = usableGasCuFt * 28.3168;

            // For sidemount, show per-tank breakdown
            if (tank.count > 1 && tankConfig.includes('sm-')) {
                const perTankGas = totalGasCuFt / 2;
                const perTankLiters = totalGasLiters / 2;
                const perTankUsable = usableGasCuFt / 2;

                totalGasDisplay.innerHTML = `
                    <div class="gas-summary">
                        <div class="gas-summary-header">Sidemount Balance (Per Tank)</div>
                        <div class="gas-summary-row">
                            <span class="gas-label">Gas Per Tank</span>
                            <span class="gas-value">${UnitConverter.round(perTankGas, 0)} ft³ / ${UnitConverter.round(perTankLiters, 0)} L</span>
                        </div>
                        <div class="gas-summary-row">
                            <span class="gas-label">Usable Per Tank</span>
                            <span class="gas-value">${UnitConverter.round(perTankUsable, 0)} ft³ / ${UnitConverter.round(perTankLiters / 3 * 2, 0)} L</span>
                        </div>
                        <div class="gas-summary-divider"></div>
                        <div class="gas-summary-row">
                            <span class="gas-label">System Total</span>
                            <span class="gas-value highlight">${UnitConverter.round(totalGasCuFt, 0)} ft³ / ${UnitConverter.round(totalGasLiters, 0)} L</span>
                        </div>
                    </div>
                `;

                // update Turn Pressure label to be explicit
                const turnLabel = document.querySelector('.turnaround-label');
                if (turnLabel) turnLabel.textContent = "Turn Each Tank At:";

            } else {
                // Standard or Doubles (Manifold) display
                const configLabel = tank.count > 1 ? `(Doubles)` : '(Single)';
                totalGasDisplay.innerHTML = `
                    <div class="gas-summary">
                        <div class="gas-summary-row">
                            <span class="gas-label">Total Gas ${configLabel}</span>
                            <span class="gas-value highlight">${UnitConverter.round(totalGasCuFt, 0)} ft³ / ${UnitConverter.round(totalGasLiters, 0)} L</span>
                        </div>
                        <div class="gas-summary-row">
                            <span class="gas-label">Usable (⅔)</span>
                            <span class="gas-value">${UnitConverter.round(usableGasCuFt, 0)} ft³ / ${UnitConverter.round(usableGasLiters, 0)} L</span>
                        </div>
                    </div>
                `;

                // Reset label
                const turnLabel = document.querySelector('.turnaround-label');
                if (turnLabel) turnLabel.textContent = "Turn Pressure:";
            }
        }

        // Update units in display
        const unit = isMetric ? 'bar' : 'PSI';
        document.querySelectorAll('.third-unit, .turnaround-unit').forEach(el => {
            el.textContent = unit;
        });
    },

    init() {
        const startPressureInput = document.getElementById('startPressure');
        const tankConfigSelect = document.getElementById('gasPlanTankConfig');

        if (startPressureInput) {
            startPressureInput.addEventListener('input', () => this.updateDisplay());
        }
        if (tankConfigSelect) {
            tankConfigSelect.addEventListener('change', () => this.updateDisplay());
        }

        // Initial calculation
        this.updateDisplay();
    }
};

window.GasPlan = GasPlan;


/**
 * Tank Calculator Module
 * Refactored for 3-Column Layout: Visual | Specs | Analysis
 */

const TankCalculator = {
    // Tank database with specifications
    // Volume in ft³, working pressure in PSI, weight in lbs, buoyancy in lbs
    tanks: {
        // ==========================================
        // STEEL TANKS
        // ==========================================
        hp100: {
            name: 'Steel HP100',
            brand: 'Faber',
            material: 'Steel',
            ratedVolume: 100.0,
            workingPressure: 3442,
            weight: 34.0,
            buoyancyEmpty: -0.59,
            buoyancyFull: -8.41,
            internalVolume: 12.9,
            shape: 'steel'
        },
        hp120: {
            name: 'Steel HP120',
            brand: 'Faber',
            material: 'Steel',
            ratedVolume: 120.0,
            workingPressure: 3442,
            weight: 39.2,
            buoyancyEmpty: 0.65,
            buoyancyFull: -8.82,
            internalVolume: 15.3,
            shape: 'steel'
        },
        hp80: {
            name: 'Steel HP80',
            brand: 'Faber',
            material: 'Steel',
            ratedVolume: 80.0,
            workingPressure: 3442,
            weight: 28.3,
            buoyancyEmpty: -1.74,
            buoyancyFull: -8.05,
            internalVolume: 10.2,
            shape: 'steel'
        },
        lp85: {
            name: 'Steel LP85',
            brand: 'Faber',
            material: 'Steel',
            ratedVolume: 85.0,
            workingPressure: 2640,
            weight: 31.2,
            buoyancyEmpty: 2.32,
            buoyancyFull: -3.8,
            internalVolume: 13.2,
            shape: 'steel',
            sidemount: true
        },
        lp108: {
            name: 'Steel LP108',
            brand: 'Faber',
            material: 'Steel',
            ratedVolume: 108.0,
            workingPressure: 2640,
            weight: 41.0,
            buoyancyEmpty: 2.98,
            buoyancyFull: -5.02,
            internalVolume: 17.0,
            shape: 'steel'
        },
        // Sidemount Steel
        sm50: {
            name: 'Faber Steel 50',
            brand: 'Faber',
            material: 'Steel',
            ratedVolume: 50.0,
            workingPressure: 2640,
            weight: 18.9,
            buoyancyEmpty: 1.24,
            buoyancyFull: -2.43,
            internalVolume: 7.8,
            shape: 'steel',
            sidemount: true
        },

        // ==========================================
        // ALUMINUM TANKS
        // ==========================================
        al80: {
            name: 'AL80 Standard',
            brand: 'Catalina',
            material: 'Aluminum',
            ratedVolume: 77.4,
            workingPressure: 3000,
            weight: 31.6,
            buoyancyFull: -2.6,
            buoyancyEmpty: 2.8,
            internalVolume: 11.1,
            shape: 'aluminum'
        },
        al80_luxfer: {
            name: 'AL80 Luxfer',
            brand: 'Luxfer',
            material: 'Aluminum',
            ratedVolume: 77.4,
            workingPressure: 3000,
            weight: 31.5,
            buoyancyFull: -1.7,
            buoyancyEmpty: 4.2,
            internalVolume: 11.1,
            shape: 'aluminum'
        },
        al40: {
            name: 'AL40',
            brand: 'Catalina',
            material: 'Aluminum',
            ratedVolume: 40.0,
            workingPressure: 3000,
            weight: 14.9,
            buoyancyFull: -0.7,
            buoyancyEmpty: 2.4,
            internalVolume: 5.7,
            shape: 'aluminum',
            sidemount: true
        },
        al63: {
            name: 'AL63',
            brand: 'Catalina',
            material: 'Aluminum',
            ratedVolume: 63.0,
            workingPressure: 3000,
            weight: 26.0,
            buoyancyFull: -0.8,
            buoyancyEmpty: 3.5,
            internalVolume: 9.0,
            shape: 'aluminum'
        }
    },

    getTank(tankId) {
        // Direct match
        if (this.tanks[tankId]) return this.tanks[tankId];

        // Handle Variants (Doubles / Sidemount)
        // Format: constant_baseId (e.g., doubles_lp85, sm_hp100)

        let baseId = tankId;
        let isDoubles = false;
        let isSidemount = false;

        if (tankId.startsWith('doubles_')) {
            baseId = tankId.replace('doubles_', '');
            isDoubles = true;
        } else if (tankId.startsWith('sm_')) {
            baseId = tankId.replace('sm_', '');
            isSidemount = true;
        }

        const baseTank = this.tanks[baseId];
        if (baseTank) {
            // Create a derived tank object
            return {
                ...baseTank,
                name: baseTank.name + (isDoubles ? ' Doubles' : (isSidemount ? ' SM' : '')),
                doubles: isDoubles,
                sidemount: isSidemount,
                // Double the capacity for calculation purposes
                ratedVolume: baseTank.ratedVolume * 2,
                weight: baseTank.weight * 2,
                buoyancyEmpty: baseTank.buoyancyEmpty * 2,
                buoyancyFull: baseTank.buoyancyFull * 2
            };
        }

        // Fallback
        return this.tanks.hp100;
    },

    // Get buoyancy at specific pressure
    getBuoyancyAtPressure(tank, currentPressure) {
        const fillFraction = currentPressure / tank.workingPressure;
        // Clamp between 0 and 1 (though technically overfill is possible)
        const safeFraction = Math.max(0, fillFraction); // allow overfill calc

        // Linear interpolation: Empty + (Diff * Fraction)
        // Diff = Full - Empty
        const totalGasWeight = tank.buoyancyFull - tank.buoyancyEmpty; // This represents the weight of the gas
        // Wait, standard convention: 
        // Buoyancy = Archimedes - Weight.
        // Weight changes. Archimedes (Volume) is constant.
        // So Buoyancy_Current = Buoyancy_Empty - (Gas_Weight_Per_PSI * Pressure)
        // Actually simpler: Lerp.

        // Let's use the Full/Empty points since they are standard specs
        // If tank is 3000psi, buoyancyFull is at 3000.

        const slope = (tank.buoyancyFull - tank.buoyancyEmpty) / 1; // per 100% fill
        return tank.buoyancyEmpty + (slope * safeFraction);
    },

    // Convert to metric
    toMetric(tank) {
        return {
            ...tank,
            ratedVolume: tank.ratedVolume * 28.3168,
            workingPressure: tank.workingPressure * 0.0689476,
            weight: tank.weight * 0.453592,
            buoyancyEmpty: tank.buoyancyEmpty * 0.453592,
            buoyancyFull: tank.buoyancyFull * 0.453592
        };
    },

    // ==========================================
    // UI UPDATES
    // ==========================================

    init() {
        const tankTypeSelect = document.getElementById('tankType');
        const tankPressureInput = document.getElementById('tankPressure');
        const tankPressureSlider = document.getElementById('tankPressureSlider');

        if (tankTypeSelect) {
            // Initial render
            this.updateAll();

            // Listeners
            tankTypeSelect.addEventListener('change', () => this.updateAll());

            if (tankPressureInput && tankPressureSlider) {
                // Sync Input -> Slider
                tankPressureInput.addEventListener('input', () => {
                    tankPressureSlider.value = tankPressureInput.value;
                    this.updateAnalysis();
                });

                // Sync Slider -> Input
                tankPressureSlider.addEventListener('input', () => {
                    tankPressureInput.value = tankPressureSlider.value;
                    this.updateAnalysis();
                });
            }
        }
    },

    updateAll() {
        const tankTypeSelect = document.getElementById('tankType');
        const tankId = tankTypeSelect ? tankTypeSelect.value : 'hp100';

        this.renderVisual(tankId);
        this.renderSpecs(tankId);
        this.updateAnalysis();
    },

    // 1. Render Technical SVG (High Fidelity)
    renderVisual(tankId) {
        const container = document.getElementById('tankVisualContainer');
        if (!container) return;

        const tank = this.getTank(tankId);
        const isSteel = tank.material === 'Steel'; // Check material property, not shape
        const isSidemount = tank.sidemount === true;
        const isDoubles = tank.doubles === true;
        const tankCount = (isSidemount || isDoubles) ? 2 : 1;

        // Get current pressure for dynamic fill level
        const pressureInput = document.getElementById('tankPressure');
        const currentPressure = pressureInput ? parseFloat(pressureInput.value) : tank.workingPressure;
        const fillRatio = Math.min(1, Math.max(0, currentPressure / tank.workingPressure));

        // Colors (Technical Blueprint Style)
        const cStroke = '#00d4ff'; // Cyan outlines
        const cFill = '#0a1220';   // Dark blue background
        const cGas = 'rgba(0, 212, 255, 0.3)'; // Gas fill color
        const cMetalDark = '#1e293b';

        // Dimensions
        const w = container.clientWidth || 200;
        const h = 380; // Match CSS height

        // Tank Geometry
        const tWidth = 70;
        const tHeight = 240;
        const tGap = 90; // Gap between tank centers for doubles/SM

        // Center calculations
        let startX;
        if (tankCount === 1) {
            startX = (w / 2);
        } else {
            startX = (w / 2) - (tGap / 2);
        }

        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="tankGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
                        <stop offset="30%" style="stop-color:#334155;stop-opacity:1" />
                        <stop offset="60%" style="stop-color:#0f172a;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#020617;stop-opacity:1" />
                    </linearGradient>

                    <!-- Steel Tank Shape (Round bottom) -->
                    <path id="shapeSteel" d="M-${tWidth / 2},20 Q-${tWidth / 2},0 0,0 Q${tWidth / 2},0 ${tWidth / 2},20 V${tHeight - 20} Q${tWidth / 2},${tHeight} 0,${tHeight} Q-${tWidth / 2},${tHeight} -${tWidth / 2},${tHeight - 20} Z" />
                    
                    <!-- Aluminum Tank Shape (Flat bottom) -->
                    <path id="shapeAl" d="M-${tWidth / 2},20 Q-${tWidth / 2},0 0,0 Q${tWidth / 2},0 ${tWidth / 2},20 V${tHeight} H-${tWidth / 2} Z" />

                    <!-- Tank Boot (Steel) -->
                    <path id="boot" d="M-${tWidth / 2},${tHeight - 30} H${tWidth / 2} V${tHeight - 20} Q${tWidth / 2},${tHeight} 0,${tHeight} Q-${tWidth / 2},${tHeight} -${tWidth / 2},${tHeight - 20} Z" fill="none" stroke="${cStroke}" stroke-width="1" stroke-dasharray="2,2"/>

                    <!-- DIN Valve -->
                    <g id="valve">
                        <rect x="-15" y="-35" width="30" height="35" rx="3" fill="${cMetalDark}" stroke="${cStroke}" stroke-width="2"/>
                        <circle cx="0" cy="-18" r="8" fill="none" stroke="${cStroke}" stroke-width="2"/>
                        <rect x="15" y="-30" width="10" height="15" fill="${cMetalDark}" stroke="${cStroke}" stroke-width="2"/> <!-- Knob -->
                    </g>
                </defs>

                <!-- Grid Background -->
                <path d="M0,${h - 40} H${w}" stroke="#1e293b" stroke-width="1"/>

                ${Array.from({ length: tankCount }).map((_, i) => {
            const x = startX + (i * tGap);
            const y = 60;
            const shapeId = isSteel ? '#shapeSteel' : '#shapeAl';
            const fillHeight = tHeight * fillRatio;
            const emptyHeight = tHeight - fillHeight;

            return `
                        <g transform="translate(${x}, ${y})">
                            <!-- Tank Body -->
                            <use href="${shapeId}" fill="url(#tankGrad)" stroke="${cStroke}" stroke-width="2"/>
                            
                            <!-- Boot if Steel -->
                            ${isSteel ? `<use href="#boot" opacity="0.6"/>` : ''}

                            <!-- Liquid Level / Gas Fill -->
                            <g clip-path="url(#clip${i})">
                                <use href="${shapeId}" fill="none"/> <!-- Clip Ref -->
                            </g>
                            <clipPath id="clip${i}">
                                <rect x="-${tWidth / 2}" y="${emptyHeight}" width="${tWidth}" height="${fillHeight}" />
                            </clipPath>
                            
                            <!-- Fill Overlay -->
                            <g clip-path="url(#clipFill${i})">
                                <use href="${shapeId}" fill="${cGas}" />
                            </g>
                             <clipPath id="clipFill${i}">
                                <rect x="-${tWidth / 2}" y="${emptyHeight}" width="${tWidth}" height="${fillHeight}" />
                            </clipPath>

                            <!-- Valve -->
                            <use href="#valve" />

                            <!-- Label -->
                            <text x="0" y="${tHeight / 2}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="monospace" font-size="12" font-weight="bold" pointer-events="none">
                                ${tank.name.split(' ')[0]} ${tank.ratedVolume}
                            </text>
                            
                            <!-- Pressure Text -->
                            <text x="0" y="${tHeight / 2 + 20}" text-anchor="middle" fill="${cStroke}" font-family="monospace" font-size="10" pointer-events="none">
                                ${Math.round(currentPressure)} PSI
                            </text>
                        </g>
                    `;
        }).join('')}
                
                <!-- Manifold for Doubles -->
                ${isDoubles ? `
                    <g transform="translate(${startX + (tGap / 2)}, 35)">
                         <rect x="-${tGap / 2}" y="0" width="${tGap}" height="10" fill="${cMetalDark}" stroke="${cStroke}" stroke-width="2"/>
                         <circle cx="0" cy="5" r="4" fill="${cStroke}"/>
                    </g>
                ` : ''}

            </svg>
        `;
    },

    // 2. Render Specs
    renderSpecs(tankId) {
        const container = document.getElementById('tankSpecsList');
        if (!container) return;

        const tank = this.getTank(tankId);
        const isMetric = window.App?.isMetric || false;

        // Display values
        const vol = isMetric ? UnitConverter.round(tank.ratedVolume * 28.3168, 0) + ' L' : tank.ratedVolume + ' ft³';
        const press = isMetric ? UnitConverter.round(tank.workingPressure * 0.0689476, 0) + ' bar' : tank.workingPressure + ' PSI';
        const weight = isMetric ? UnitConverter.round(tank.weight * 0.453592, 1) + ' kg' : tank.weight + ' lbs';
        const mat = tank.material;

        container.innerHTML = `
            <div class="spec-row">
                <span class="spec-label">Rated Volume</span>
                <span class="spec-value">${vol}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label">Working Pressure</span>
                <span class="spec-value">${press}</span>
            </div>
             <div class="spec-row">
                <span class="spec-label">Weight (Empty)</span>
                <span class="spec-value">${weight}</span>
            </div>
             <div class="spec-row">
                <span class="spec-label">Material</span>
                <span class="spec-value">${mat}</span>
            </div>
        `;
    },

    // 3. Render Analysis (Real Volume + Buoyancy)
    updateAnalysis() {
        const tankTypeSelect = document.getElementById('tankType');
        const pressureInput = document.getElementById('tankPressure');
        if (!tankTypeSelect || !pressureInput) return;

        const tankId = tankTypeSelect.value;
        const tank = this.getTank(tankId);
        const isMetric = window.App?.isMetric || false;

        let currentPressure = parseFloat(pressureInput.value) || 0;

        // Store display pressure
        let displayPressure = currentPressure;

        // Update tank visual (for dynamic fill level)
        this.renderVisual(tankId);

        // If in Metric mode, input is Bar -> Convert to PSI for calc
        if (isMetric) {
            currentPressure = currentPressure / 0.0689476;
        }

        // 1. Real Gas Volume
        const realVolCuFt = (currentPressure / tank.workingPressure) * tank.ratedVolume;
        const realVolL = realVolCuFt * 28.3168;

        const gasDisplay = document.getElementById('availableGas');
        if (gasDisplay) {
            gasDisplay.textContent = isMetric ? `${UnitConverter.round(realVolL, 0)} L` : `${UnitConverter.round(realVolCuFt, 1)} ft³`;
        }

        // 2. Buoyancy
        const buoyancy = this.getBuoyancyAtPressure(tank, currentPressure);
        const displayBuoyancy = isMetric ? buoyancy * 0.453592 : buoyancy;
        const bUnit = isMetric ? 'kg' : 'lbs';

        const bContainer = document.getElementById('buoyancyDisplay');
        if (bContainer) {
            const isFloat = displayBuoyancy > 0;
            const isSink = displayBuoyancy < 0;
            const valStr = UnitConverter.round(Math.abs(displayBuoyancy), 1);

            const statusClass = isFloat ? 'b-float' : (isSink ? 'b-sink' : '');
            const icon = isFloat ? '▲' : (isSink ? '▼' : '●');
            const text = isFloat ? 'FLOATS' : (isSink ? 'SINKS' : 'NEUTRAL');

            bContainer.innerHTML = `
                <div class="b-arrow ${statusClass}" style="font-size: 1.5rem;">
                    <span>${icon}</span>
                    <span>${valStr} ${bUnit}</span>
                </div>
                <span style="font-size: 0.8rem; opacity: 0.7; letter-spacing: 1px;">${text}</span>
            `;
        }
    }
};

window.TankCalculator = TankCalculator;

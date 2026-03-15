/**
 * Penetration Calculator Module
 * Refactored for Team Gas Management with individual Tank tracking
 */

const PenetrationCalculator = {
    // Tank SPECIFICATIONS (Single Cylinder Volumes)
    tankSpecs: {
        al80: { volume: 77.4, workingPsi: 3000 },
        hp100: { volume: 100, workingPsi: 3442 },
        lp85: { volume: 85, workingPsi: 2640 },
        'doubles-lp85': { volume: 170, workingPsi: 2640 }, // Manifolded total
        'doubles-hp100': { volume: 200, workingPsi: 3442 }, // Manifolded total
        'sm-al80': { volume: 77.4, workingPsi: 3000 },    // Volume PER TANK
        'sm-al40': { volume: 40, workingPsi: 3000 },      // Volume PER TANK
        'sm-lp85': { volume: 85, workingPsi: 2640 },      // Volume PER TANK
        'sm-steel50': { volume: 50, workingPsi: 2640 }    // Volume PER TANK
    },

    certLimits: {
        'cavern': 200,
        'apprentice': 1000,
        'full': Infinity
    },

    // 1. GAS VOLUME CALCULATION
    // Returns total volume in ft3 based on Tank Type and 1 or 2 tank pressures
    calculateGasVolume(tankType, p1, p2) {
        const spec = this.tankSpecs[tankType] || this.tankSpecs.al80;

        // Special handling for manifolded doubles: Use average pressure or just p1
        if (tankType.includes('doubles')) {
            const avgP = (p2 > 0) ? (p1 + p2) / 2 : p1;
            return (avgP / spec.workingPsi) * spec.volume;
        }

        // Sidemount or Single: Each tank has its own volume
        let totalVolume = (p1 / spec.workingPsi) * spec.volume;
        if (p2 > 0) {
            totalVolume += (p2 / spec.workingPsi) * spec.volume;
        }

        return totalVolume;
    },

    // 2. MAIN CALCULATION
    calculate(yourData, partnerData, depth, swimSpeed, certLevel) {
        const ata = (depth + 33) / 33;
        const stressMultiplier = 1.5;

        // Calculate Gas for each diver
        const yourGas = this.calculateGasVolume(yourData.tankType, yourData.p1, yourData.p2);
        const partnerGas = this.calculateGasVolume(partnerData.tankType, partnerData.p1, partnerData.p2);

        // 1/3rd Rules
        const yourUsable = yourGas / 3;
        const partnerUsable = partnerGas / 3;

        // Rates
        const yourRate = yourData.sac * ata;
        const partnerRate = partnerData.sac * ata;

        // Time to turn (Individual 1/3 limits)
        const yourTime = yourUsable / yourRate;
        const partnerTime = partnerUsable / partnerRate;

        let penetrationTime = Math.min(yourTime, partnerTime);
        let limitingFactor = yourTime <= partnerTime ? "YOU (1/3rd Rule)" : "PARTNER (1/3rd Rule)";

        // Rock Bottom Check (Reserve of the team)
        // In an emergency at the turn (1/3 point), the team has 2/3 of the buddy's gas left.
        // We ensure that 2/3rds of the buddy's gas can get BOTH divers out while stressed.
        const buddyGasAtTurn = Math.min(yourGas, partnerGas) * (2 / 3);
        const sharedRate = (yourData.sac + partnerData.sac) * stressMultiplier * ata;
        const maxSafeExitTime = buddyGasAtTurn / sharedRate;

        if (maxSafeExitTime < penetrationTime) {
            penetrationTime = maxSafeExitTime;
            limitingFactor = "ROCK BOTTOM (Team Safety)";
        }

        let maxDistance = penetrationTime * swimSpeed;

        // Cert Limit
        const certLimit = this.certLimits[certLevel] || 1000;
        if (maxDistance > certLimit) {
            maxDistance = certLimit;
            limitingFactor = `TRAINING LIMIT (${certLevel.toUpperCase()})`;
        }

        return {
            maxDistance: Math.round(maxDistance),
            penetrationTime: UnitConverter.round(maxDistance / swimSpeed, 1),
            yourGas: UnitConverter.round(yourGas, 1),
            partnerGas: UnitConverter.round(partnerGas, 1),
            limitingFactor: limitingFactor,
            sharedRate: UnitConverter.round(sharedRate, 2)
        };
    },

    calculateEmergency(yourData, partnerData, depth, swimSpeed, testDistance) {
        const ata = (depth + 33) / 33;
        const stressMultiplier = 1.5;
        const sharedRate = (yourData.sac + partnerData.sac) * stressMultiplier * ata;
        const exitTime = testDistance / swimSpeed;
        const gasNeeded = sharedRate * exitTime;

        // Available gas at turn (2/3 of buddy's gas)
        const buddyGas = this.calculateGasVolume(partnerData.tankType, partnerData.p1, partnerData.p2);
        const gasAvailable = (2 / 3) * buddyGas;

        const canMakeIt = gasNeeded <= gasAvailable + 0.1;
        const marginPercent = ((gasAvailable - gasNeeded) / gasAvailable) * 100;

        return {
            exitTime: UnitConverter.round(exitTime, 1),
            gasNeeded: UnitConverter.round(gasNeeded, 1),
            gasAvailable: UnitConverter.round(gasAvailable, 1),
            canMakeIt,
            marginPercent: Math.round(marginPercent)
        };
    },

    updateDisplay() {
        // Diver 1 Inputs
        const yourData = {
            sac: parseFloat(document.getElementById('yourSac')?.value) || 0.5,
            tankType: document.getElementById('yourTankType')?.value || 'al80',
            p1: parseFloat(document.getElementById('yourTank1')?.value) || 3000,
            p2: parseFloat(document.getElementById('yourTank2')?.value) || 0
        };

        // Diver 2 Inputs
        const partnerData = {
            sac: parseFloat(document.getElementById('partnerSac')?.value) || 0.6,
            tankType: document.getElementById('partnerTankType')?.value || 'al80',
            p1: parseFloat(document.getElementById('partnerTank1')?.value) || 3000,
            p2: parseFloat(document.getElementById('partnerTank2')?.value) || 0
        };

        const depth = parseFloat(document.getElementById('penDepth')?.value) || 60;
        const swimSpeed = parseFloat(document.getElementById('swimSpeed')?.value) || 50;
        const certLevel = document.getElementById('penCertLevel')?.value || 'apprentice';
        const testSlider = document.getElementById('testDistSlider');

        const result = this.calculate(yourData, partnerData, depth, swimSpeed, certLevel);

        // Update UI
        document.getElementById('maxPenetration').textContent = result.maxDistance;

        const detailsDisplay = document.getElementById('penDetails');
        if (detailsDisplay) {
            detailsDisplay.innerHTML = `
                <div class="pen-detail-item">
                    <span>Penetration Time</span>
                    <span>${result.penetrationTime} min</span>
                </div>
                <div class="pen-detail-item highlight">
                    <span>Limiting Factor</span>
                    <span style="color:var(--accent-primary)">${result.limitingFactor}</span>
                </div>
                <div class="pen-detail-item">
                    <span>Your Total Gas</span>
                    <span>${result.yourGas} ft³</span>
                </div>
                <div class="pen-detail-item">
                    <span>Partner Total Gas</span>
                    <span>${result.partnerGas} ft³</span>
                </div>
            `;
        }

        // Slider logic
        if (testSlider) {
            // Update slider range to match current calculation
            const sliderMax = Math.max(Math.round(result.maxDistance * 1.5), 500);
            testSlider.max = sliderMax;

            let currentDist = parseFloat(testSlider.value) || 0;

            // Auto-set to maxDistance on first load or if slider was at 0
            if (currentDist === 0 || !this._initialized) {
                testSlider.value = result.maxDistance;
                currentDist = result.maxDistance;
                this._initialized = true;
            }

            // Clamp slider value if it exceeds the new max
            if (currentDist > sliderMax) {
                testSlider.value = sliderMax;
                currentDist = sliderMax;
            }

            document.getElementById('testDistValue').textContent = Math.round(currentDist);

            const emergency = this.calculateEmergency(yourData, partnerData, depth, swimSpeed, currentDist);
            const emergencyDisplay = document.getElementById('emergencyInfo');
            const isExceeding = currentDist > result.maxDistance;

            if (emergencyDisplay) {
                const statusClass = !emergency.canMakeIt ? 'danger' : (isExceeding ? 'caution' : 'safe');
                let statusText = emergency.canMakeIt ? (isExceeding ? "⚠️ DANGEROUS: EXCEEDS RULE OF THIRDS" : "✅ SECURE") : "❌ FATAL: OUT OF GAS";

                emergencyDisplay.innerHTML = `
                    <p class="emergency-desc">Simulation Profile at ${Math.round(currentDist)}ft:</p>
                    <div class="emergency-stat">
                        <span>Exit Time</span>
                        <span>${emergency.exitTime} min</span>
                    </div>
                    <div class="emergency-stat">
                        <span>Gas Needed</span>
                        <span>${emergency.gasNeeded} ft³</span>
                    </div>
                    <div class="emergency-stat">
                        <span>Gas Available</span>
                        <span>${emergency.gasAvailable} ft³</span>
                    </div>
                    <div class="emergency-stat highlight">
                        <span>STATUS</span>
                        <span class="${statusClass}" style="font-weight:bold">${statusText}</span>
                    </div>
                `;
            }

            this.drawPenetrationGraph('penVisualContainer', currentDist, result.maxDistance, emergency.canMakeIt && !isExceeding);
        }
    },

    drawPenetrationGraph(containerId, testDist, maxSafe, isSafe) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = 600;
        const height = 180;
        const padding = 50;
        const graphWidth = width - (padding * 2);

        const distVal = parseFloat(testDist) || 0;
        // Ensure scale allows for the full trip and a bit of margin
        const maxExpected = Math.max(distVal, maxSafe, 1000) * 1.2;
        const scale = graphWidth / maxExpected;

        const turnX = padding + (distVal * scale);
        const safeX = padding + (maxSafe * scale);
        const isExceeding = distVal > maxSafe;

        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="caveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#0f172a" />
                        <stop offset="50%" style="stop-color:#020617" />
                        <stop offset="100%" style="stop-color:#0f172a" />
                    </linearGradient>

                    <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#00f3ff" />
                        <stop offset="100%" style="stop-color:${isExceeding ? '#f43f5e' : '#10b981'}" />
                    </linearGradient>
                </defs>

                <!-- Environment -->
                <rect x="0" y="0" width="${width}" height="${height}" fill="url(#caveGrad)" rx="12" />
                
                <!-- Limestone Texture Sim -->
                <rect x="0" y="0" width="${width}" height="35" fill="rgba(30, 41, 59, 0.5)" />
                <rect x="0" y="${height - 35}" width="${width}" height="35" fill="rgba(30, 41, 59, 0.5)" />
                
                <!-- Technical Grid Lines -->
                <g opacity="0.2">
                    ${[0, 0.25, 0.5, 0.75, 1.0].map(p => {
            const x = padding + p * graphWidth;
            const labelDist = Math.round(p * maxExpected);
            return `
                        <line x1="${x}" y1="35" x2="${x}" y2="${height - 35}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4" />
                        <text x="${x}" y="${height - 15}" text-anchor="middle" fill="#94a3b8" font-size="10">${labelDist}ft</text>
                    `}).join('')}
                </g>

                <!-- Safety Threshold Zone -->
                <rect x="${padding}" y="40" width="${safeX - padding}" height="${height - 80}" fill="rgba(16, 185, 129, 0.05)" rx="4" />
                ${isExceeding ? `<rect x="${safeX}" y="40" width="${turnX - safeX}" height="${height - 80}" fill="rgba(244, 63, 94, 0.1)" rx="4" />` : ''}

                <!-- Safe Limit Terminal -->
                <g>
                    <line x1="${safeX}" y1="25" x2="${safeX}" y2="${height - 25}" stroke="#00f3ff" stroke-width="3" stroke-dasharray="8,4" />
                    <rect x="${safeX - 45}" y="10" width="90" height="18" rx="4" fill="#00f3ff" />
                    <text x="${safeX}" y="23" text-anchor="middle" fill="#000" font-family="sans-serif" font-size="10" font-weight="900">SAFE LIMIT</text>
                </g>

                <!-- Planned Path -->
                <path d="M ${padding},90 L ${turnX},90" stroke="url(#pathGrad)" stroke-width="10" stroke-linecap="round" />
                <path d="M ${padding},90 L ${turnX},90" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.4" />

                <!-- Diver Icon -->
                <g transform="translate(${turnX - 10}, 80)">
                    <circle cx="0" cy="10" r="5" fill="#fff" />
                    <rect x="0" y="4" width="20" height="12" rx="4" fill="#fff" />
                    <path d="M 20,10 L 120,0 L 120,20 Z" fill="rgba(0, 243, 255, 0.2)" opacity="${isExceeding ? 0 : 1}" />
                </g>

                <!-- Current Depth/Distance Label -->
                <g transform="translate(${turnX}, 135)">
                    <rect x="-35" y="-14" width="70" height="28" rx="8" fill="#1e293b" stroke="${isExceeding ? '#f43f5e' : '#00f3ff'}" stroke-width="2" />
                    <text x="0" y="5" text-anchor="middle" fill="#fff" font-family="monospace" font-size="14" font-weight="900">${Math.round(distVal)}ft</text>
                </g>

                <!-- Danger Alarm -->
                ${isExceeding ? `
                    <g transform="translate(${safeX}, 90)">
                        <circle cx="0" cy="0" r="20" fill="none" stroke="#f43f5e" stroke-width="4">
                            <animate attributeName="r" values="15;25;15" dur="0.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                        <text x="0" y="50" text-anchor="middle" fill="#f43f5e" font-size="12" font-weight="900">LIMIT VIOLATED</text>
                    </g>
                ` : ''}
            </svg>
        `;
    },

    init() {
        const ids = [
            'yourSac', 'yourTankType', 'yourTank1', 'yourTank2',
            'partnerSac', 'partnerTankType', 'partnerTank1', 'partnerTank2',
            'penDepth', 'swimSpeed', 'penCertLevel', 'testDistSlider'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateDisplay());
                el.addEventListener('change', () => this.updateDisplay());
            }
        });
        this.updateDisplay();
    }
};

window.PenetrationCalculator = PenetrationCalculator;

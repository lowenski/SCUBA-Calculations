/**
 * SAC Rate Calculator Module
 * Calculate Surface Air Consumption from dive data
 */

const SACCalculator = {
    // Tank data for volume calculations
    tanks: {
        al80: { volume: 77.4, workingPsi: 3000 },
        hp100: { volume: 100, workingPsi: 3442 },
        lp85: { volume: 85, workingPsi: 2640 }
    },

    // Calculate SAC rate
    calculate(startPsi, endPsi, avgDepth, diveTime, tankType) {
        const tank = this.tanks[tankType] || this.tanks.al80;

        // Pressure used
        const psiUsed = startPsi - endPsi;

        // SAC in psi/min (at surface)
        const ata = (avgDepth + 33) / 33;
        const sacPsi = psiUsed / diveTime / ata;

        // Convert to RMV (Respiratory Minute Volume) in ft³/min
        // First get total gas used in ft³
        const gasUsed = (psiUsed / tank.workingPsi) * tank.volume;

        // RMV = gas used at surface equivalent / time
        const rmv = gasUsed / ata / diveTime;

        return {
            sacPsi: UnitConverter.round(sacPsi, 1),
            rmv: UnitConverter.round(rmv, 2),
            gasUsed: UnitConverter.round(gasUsed, 1),
            ata: UnitConverter.round(ata, 2)
        };
    },

    // Interpret SAC rate
    interpretSac(rmv) {
        if (rmv < 0.4) {
            return { rating: 'excellent', text: 'Excellent! Very efficient air consumption.' };
        } else if (rmv < 0.6) {
            return { rating: 'good', text: 'Good. Typical for experienced divers.' };
        } else if (rmv < 0.8) {
            return { rating: 'average', text: 'Average. Room for improvement.' };
        } else {
            return { rating: 'high', text: 'High consumption. Work on relaxation and buoyancy.' };
        }
    },

    updateDisplay() {
        const startInput = document.getElementById('sacStart');
        const endInput = document.getElementById('sacEnd');
        const depthInput = document.getElementById('sacDepth');
        const timeInput = document.getElementById('sacTime');
        const tankSelect = document.getElementById('sacTankType');
        const sacPsiDisplay = document.getElementById('sacPressure');
        const rmvDisplay = document.getElementById('sacRmv');
        const interpretDisplay = document.getElementById('sacInterpretation');

        if (!startInput || !sacPsiDisplay) return;

        const isMetric = window.App?.isMetric || false;

        let startPressure = parseFloat(startInput?.value) || 3000;
        let endPressure = parseFloat(endInput?.value) || 1500;
        let avgDepth = parseFloat(depthInput?.value) || 60;
        const diveTime = parseFloat(timeInput?.value) || 45;
        const tankType = tankSelect?.value || 'al80';

        // Convert from metric if needed
        if (isMetric) {
            // Bar to PSI
            startPressure = startPressure / 0.0689476;
            endPressure = endPressure / 0.0689476;
            // Meters to feet
            avgDepth = avgDepth / 0.3048;
        }

        const result = this.calculate(startPressure, endPressure, avgDepth, diveTime, tankType);
        const interpretation = this.interpretSac(result.rmv);

        // Display SAC in pressure units
        if (sacPsiDisplay) {
            const displaySac = isMetric ? result.sacPsi * 0.0689476 : result.sacPsi;
            const pressureUnit = isMetric ? 'bar/min' : 'psi/min';
            sacPsiDisplay.textContent = UnitConverter.round(displaySac, isMetric ? 2 : 1);

            // Update unit label
            const sacPressureUnit = sacPsiDisplay.nextElementSibling;
            if (sacPressureUnit) {
                sacPressureUnit.textContent = pressureUnit;
            }
        }

        // Display RMV
        if (rmvDisplay) {
            const displayRmv = isMetric ? result.rmv * 28.3168 : result.rmv;
            const volumeUnit = isMetric ? 'L/min' : 'ft³/min';
            rmvDisplay.textContent = UnitConverter.round(displayRmv, 2);

            // Update unit label
            const rmvUnit = rmvDisplay.nextElementSibling;
            if (rmvUnit) {
                rmvUnit.textContent = volumeUnit;
            }
        }

        // Display interpretation
        if (interpretDisplay) {
            interpretDisplay.innerHTML = `
                <div class="sac-rating ${interpretation.rating}">${interpretation.rating.toUpperCase()}</div>
                <div>${interpretation.text}</div>
            `;

            // Draw Breathing Animation
            this.drawBreathingRate('sacVisualContainer', result.rmv, interpretation.rating);
        }
    },

    // Draw Breathing Rate Animation (Technical Anatomical Style)
    drawBreathingRate(containerId, rmv, rating) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Calculate animation duration based on RMV
        // Lower RMV = Slower breathing (more seconds)
        // High RMV = Faster breathing (fewer seconds)
        // Base: 0.5 RMV -> 6s cycle. 1.0 RMV -> 3s cycle.
        const cycleTime = Math.max(1.5, Math.min(10, 3 / rmv));

        const width = 280;
        const height = 200;
        const centerX = width / 2;

        // Color Map (Blueprint Style)
        const cStroke = '#00d4ff';
        const cFill = '#0a1220';
        const cGrid = '#1f2937';

        const colorMap = {
            'excellent': '#00d4ff', // Cyan
            'good': '#00ff9d',      // Green
            'average': '#ffb800',   // Yellow
            'high': '#ff4466'       // Red
        };
        const lungColor = colorMap[rating] || '#00d4ff';

        container.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${cGrid}" stroke-width="0.5"/>
                </pattern>
                
                <radialGradient id="lungGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style="stop-color:${lungColor};stop-opacity:0.8" />
                    <stop offset="100%" style="stop-color:${lungColor};stop-opacity:0.2" />
                </radialGradient>
            </defs>
            
            <style>
                @keyframes breathe {
                    0%, 100% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.08); opacity: 1; }
                }
                @keyframes diaphragm {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(10px); }
                }
                .lungs {
                    transform-origin: center 100px; /* Pivot from middle */
                    animation: breathe ${cycleTime.toFixed(1)}s ease-in-out infinite;
                }
                .diaphragm {
                    animation: diaphragm ${cycleTime.toFixed(1)}s ease-in-out infinite;
                }
            </style>
            
            <!-- Background Grid -->
            <rect width="100%" height="100%" fill="${cFill}"/>
            <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5"/>

            <!-- Ribcage Outline (Static Context) -->
            <g stroke="#374151" stroke-width="1" fill="none" opacity="0.5">
                <!-- Spine -->
                <path d="M${centerX},20 L${centerX},160" stroke-dasharray="2,2"/>
                <!-- Ribs Left -->
                <path d="M${centerX},40 Q80,40 60,80" />
                <path d="M${centerX},60 Q70,60 50,100" />
                <path d="M${centerX},80 Q65,80 45,120" />
                <path d="M${centerX},100 Q60,100 50,140" />
                <!-- Ribs Right -->
                <path d="M${centerX},40 Q${width - 80},40 ${width - 60},80" />
                <path d="M${centerX},60 Q${width - 70},60 ${width - 50},100" />
                <path d="M${centerX},80 Q${width - 65},80 ${width - 45},120" />
                <path d="M${centerX},100 Q${width - 60},100 ${width - 50},140" />
            </g>

            <!-- Anatomical Lungs Group -->
            <g class="lungs">
                <!-- Trachea -->
                <path d="M${centerX - 10},20 L${centerX - 10},60 M${centerX + 10},20 L${centerX + 10},60" stroke="${cStroke}" stroke-width="2" fill="none"/>
                <!-- Cartilage Rings -->
                <line x1="${centerX - 10}" y1="30" x2="${centerX + 10}" y2="30" stroke="${cStroke}" stroke-width="1" opacity="0.5"/>
                <line x1="${centerX - 10}" y1="40" x2="${centerX + 10}" y2="40" stroke="${cStroke}" stroke-width="1" opacity="0.5"/>
                <line x1="${centerX - 10}" y1="50" x2="${centerX + 10}" y2="50" stroke="${cStroke}" stroke-width="1" opacity="0.5"/>

                <!-- Left Lung (Viewer's Left) - 2 Lobes -->
                <path d="M${centerX - 12},60 
                         C${centerX - 40},50 ${centerX - 80},70 ${centerX - 80},110 
                         C${centerX - 80},150 ${centerX - 20},160 ${centerX - 12},150 
                         Z" 
                         fill="url(#lungGrad)" stroke="${lungColor}" stroke-width="2"/>
                <!-- Lobe Divider -->
                <path d="M${centerX - 80},110 Q${centerX - 40},120 ${centerX - 12},100" stroke="${lungColor}" stroke-width="1" fill="none" opacity="0.5"/>

                <!-- Right Lung (Viewer's Right) - 3 Lobes -->
                <path d="M${centerX + 12},60 
                         C${centerX + 40},50 ${centerX + 80},70 ${centerX + 80},110 
                         C${centerX + 80},150 ${centerX + 20},160 ${centerX + 12},150 
                         Z" 
                         fill="url(#lungGrad)" stroke="${lungColor}" stroke-width="2"/>
                 <!-- Lobe Dividers -->
                <path d="M${centerX + 80},90 Q${centerX + 40},100 ${centerX + 12},90" stroke="${lungColor}" stroke-width="1" fill="none" opacity="0.5"/>
                <path d="M${centerX + 80},130 Q${centerX + 40},140 ${centerX + 12},120" stroke="${lungColor}" stroke-width="1" fill="none" opacity="0.5"/>
            </g>
            
            <!-- Diaphragm Muscle (Moving) -->
            <path class="diaphragm" d="M40,150 Q${centerX},130 ${width - 40},150 v10 H40 Z" fill="#374151" opacity="0.3"/>

            <!-- HUD Overlay -->
            <g transform="translate(10, ${height - 15})">
                <text fill="#8892a6" font-family="monospace" font-size="10">RMV: ${rmv}</text>
                <text y="10" fill="#8892a6" font-family="monospace" font-size="10">CYCLE: ${cycleTime.toFixed(1)}s</text>
            </g>
            
            <g transform="translate(${width - 10}, ${height - 15})" text-anchor="end">
                 <text fill="${lungColor}" font-family="monospace" font-size="10" font-weight="bold">${rating.toUpperCase()}</text>
                 <text y="10" fill="#8892a6" font-family="monospace" font-size="10">EFFICIENCY</text>
            </g>
        </svg>
        `;
    },

    init() {
        const inputs = [
            'sacStart',
            'sacEnd',
            'sacDepth',
            'sacTime',
            'sacTankType'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateDisplay());
                element.addEventListener('change', () => this.updateDisplay());
            }
        });

        // Initial calculation
        this.updateDisplay();
    }
};

window.SACCalculator = SACCalculator;

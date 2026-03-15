/**
 * Nitrox Calculator Module
 * MOD, Best Mix, EAD calculations for Enriched Air
 */

const NitroxCalculator = {
    // Current settings
    o2Percent: 32,
    po2Limit: 1.4,

    // Calculate Maximum Operating Depth
    calculateMOD(o2Percent, po2Limit) {
        // MOD = ((PO2max / FO2) - 1) × 33
        const fo2 = o2Percent / 100;
        const modFeet = ((po2Limit / fo2) - 1) * 33;
        return Math.floor(modFeet);  // Round down for safety
    },

    // Calculate Best Mix for a given depth
    calculateBestMix(depthFeet, po2Limit) {
        // FO2 = PO2max / ATA
        const ata = (depthFeet + 33) / 33;
        const fo2 = po2Limit / ata;
        const o2Percent = fo2 * 100;

        // Cap at 40% for recreational nitrox
        return Math.min(40, Math.floor(o2Percent));
    },

    // Calculate Equivalent Air Depth
    calculateEAD(depthFeet, o2Percent) {
        // EAD = ((1 - FO2) / 0.79) × (depth + 33) - 33
        const fo2 = o2Percent / 100;
        const fn2 = 1 - fo2;
        const ead = (fn2 / 0.79) * (depthFeet + 33) - 33;
        return Math.round(ead);
    },

    // Calculate PO2 at depth
    calculatePO2(depthFeet, o2Percent) {
        const ata = (depthFeet + 33) / 33;
        const fo2 = o2Percent / 100;
        return UnitConverter.round(fo2 * ata, 2);
    },

    // Get PO2 status class
    getPO2Status(po2) {
        if (po2 < 1.2) return 'safe';
        if (po2 <= 1.4) return 'caution';
        return 'danger';
    },

    updateMOD() {
        const modDisplay = document.getElementById('modValue');
        const modUnitDisplay = document.getElementById('modUnit');
        const modWarning = document.getElementById('modWarning');

        if (!modDisplay) return;

        const isMetric = window.App?.isMetric || false;
        const modFeet = this.calculateMOD(this.o2Percent, this.po2Limit);

        // Display MOD
        const displayMod = isMetric ? modFeet * 0.3048 : modFeet;
        modDisplay.textContent = Math.round(displayMod);
        if (modUnitDisplay) {
            modUnitDisplay.textContent = isMetric ? 'm' : 'ft';
        }

        // Show warning if MOD is very shallow
        if (modWarning) {
            if (modFeet < 66) {
                modWarning.textContent = '⚠️ Shallow MOD - verify your mix!';
            } else {
                modWarning.textContent = '';
            }
        }

        // DRAW VISUAL GAUGE
        const ppo2 = this.calculatePO2(modFeet, this.o2Percent);
        this.drawNitroxGauge('nitroxVisualContainer', Math.round(displayMod), ppo2, this.o2Percent);
    },

    updateBestMix() {
        const depthInput = document.getElementById('bestMixDepth');
        const resultDisplay = document.getElementById('bestMixResult');

        if (!depthInput || !resultDisplay) return;

        const isMetric = window.App?.isMetric || false;
        let depth = parseFloat(depthInput.value) || 100;

        // Convert from meters to feet if metric
        if (isMetric) {
            depth = depth / 0.3048;
        }

        const bestMix = this.calculateBestMix(depth, this.po2Limit);

        if (bestMix <= 21) {
            resultDisplay.textContent = 'Air (21%)';
        } else {
            resultDisplay.textContent = `EAN${bestMix}`;
        }
    },

    // Draw authentic digital depth gauge (Shearwater style)
    drawNitroxGauge(containerId, mod, ppo2, bestMix) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isMetric = window.App?.isMetric || false;
        const depthUnit = isMetric ? 'm' : 'ft';

        // Setup SVG
        const width = 280;
        const height = 180;
        const cx = 140;
        const cy = 90;
        const radius = 70;

        // PPO2 Color Logic (Shearwater standard)
        // < 1.4 = Green, 1.4-1.6 = Yellow, > 1.6 = Red
        let ppo2Color = '#00ff9d'; // Safe
        if (ppo2 >= 1.4 && ppo2 <= 1.6) ppo2Color = '#ffb800'; // Caution
        if (ppo2 > 1.6) ppo2Color = '#ff4466'; // Danger

        // MOD Display - calculate rotation for gauge needle/arc
        // Assume gauge range 0-200ft or 0-60m
        const maxDepthGauge = isMetric ? 60 : 200;
        const modValue = parseFloat(mod);
        const gaugePercent = Math.min(modValue / maxDepthGauge, 1);
        const arcLength = 180 * gaugePercent; // semi-circle

        container.innerHTML = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#00ff9d" />
                    <stop offset="80%" style="stop-color:#ffb800" />
                    <stop offset="100%" style="stop-color:#ff4466" />
                </linearGradient>
            </defs>
            
            <!-- Gauge Background arc -->
            <path d="M40,140 A100,100 0 0,1 240,140" fill="none" stroke="#1a2540" stroke-width="20" stroke-linecap="round" />
            
            <!-- Active Arc (MOD Limit) -->
            <!-- Simple visualization of "safe zone" up to MOD -->
            <path d="M40,140 A100,100 0 0,1 240,140" fill="none" stroke="url(#gaugeGradient)" stroke-width="4" stroke-linecap="round" stroke-dasharray="10, 5" opacity="0.3" />
            
            <!-- Central Display (Digital) -->
            <text x="${cx}" y="${cy - 20}" text-anchor="middle" fill="#8892a6" font-size="14" font-family="monospace">MAX DEPTH (MOD)</text>
            <text x="${cx}" y="${cy + 25}" text-anchor="middle" fill="${ppo2Color}" font-size="48" font-weight="bold" font-family="monospace">${mod}</text>
            <text x="${cx}" y="${cy + 55}" text-anchor="middle" fill="#5a6478" font-size="16">${depthUnit}</text>
            
            <!-- PPO2 Indicator side -->
            <g transform="translate(220, 40)">
                <rect x="0" y="0" width="50" height="24" rx="4" fill="${ppo2Color}" fill-opacity="0.2" stroke="${ppo2Color}" />
                <text x="25" y="17" text-anchor="middle" fill="${ppo2Color}" font-size="12" font-weight="bold">PO2: ${ppo2}</text>
            </g>

            <!-- Best Mix Indicator side -->
            <g transform="translate(10, 40)">
                 <rect x="0" y="0" width="60" height="24" rx="4" fill="#00d4ff" fill-opacity="0.1" stroke="#00d4ff20" />
                 <text x="30" y="17" text-anchor="middle" fill="#00d4ff" font-size="12" font-weight="bold">EAN ${(bestMix || 0)}</text>
            </g>
        </svg>
        <div style="text-align:center; color:#5a6478; font-size:0.8rem; margin-top:-10px;">
            Safe limit: 1.4 PPO2
        </div>
        `;
    },

    updateEAD() {
        const depthInput = document.getElementById('eadDepth');
        const resultDisplay = document.getElementById('eadResult');
        const resultUnitDisplay = document.getElementById('eadResultUnit');

        if (!depthInput || !resultDisplay) return;

        const isMetric = window.App?.isMetric || false;
        let depth = parseFloat(depthInput.value) || 100;

        // Convert from meters to feet if metric
        if (isMetric) {
            depth = depth / 0.3048;
        }

        const ead = this.calculateEAD(depth, this.o2Percent);

        // Display EAD
        const displayEad = isMetric ? ead * 0.3048 : ead;
        resultDisplay.textContent = Math.round(displayEad);
        if (resultUnitDisplay) {
            resultUnitDisplay.textContent = isMetric ? 'm' : 'ft';
        }
    },

    updateO2Display() {
        const o2Display = document.getElementById('o2Value');
        if (o2Display) {
            o2Display.textContent = this.o2Percent;
        }

        // Update preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            const btnO2 = parseInt(btn.dataset.o2);
            btn.classList.toggle('active', btnO2 === this.o2Percent);
        });

        // Update all calculations
        this.updateMOD();
        this.updateEAD();
    },

    init() {
        // O2 Slider
        const o2Slider = document.getElementById('o2Slider');
        if (o2Slider) {
            o2Slider.addEventListener('input', () => {
                this.o2Percent = parseInt(o2Slider.value);
                this.updateO2Display();
            });
        }

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.o2Percent = parseInt(btn.dataset.o2);
                if (o2Slider) o2Slider.value = this.o2Percent;
                this.updateO2Display();
            });
        });

        // PO2 buttons
        document.querySelectorAll('.po2-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.po2Limit = parseFloat(btn.dataset.po2);

                // Update button states
                document.querySelectorAll('.po2-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });

                // Update calculations
                this.updateMOD();
                this.updateBestMix();
            });
        });

        // Best mix depth input
        const bestMixDepthInput = document.getElementById('bestMixDepth');
        if (bestMixDepthInput) {
            bestMixDepthInput.addEventListener('input', () => this.updateBestMix());
        }

        // EAD depth input
        const eadDepthInput = document.getElementById('eadDepth');
        if (eadDepthInput) {
            eadDepthInput.addEventListener('input', () => this.updateEAD());
        }

        // Initial calculations
        this.updateO2Display();
        this.updateBestMix();
    }
};

window.NitroxCalculator = NitroxCalculator;

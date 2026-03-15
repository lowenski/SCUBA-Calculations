/**
 * PO2 Table Module
 * Generate PO2 depth table for various mixes
 */

const PO2Table = {
    mixes: [21, 28, 32, 36, 40],
    depths: [0, 33, 50, 66, 80, 100, 110, 130, 140, 165],

    calculatePO2(depthFeet, o2Percent) {
        const ata = (depthFeet + 33) / 33;
        return (o2Percent / 100) * ata;
    },

    getStatusClass(po2) {
        if (po2 < 1.2) return 'safe';
        if (po2 <= 1.4) return 'caution';
        return 'danger';
    },

    generateTable() {
        const table = document.getElementById('po2Table');
        if (!table) return;

        const isMetric = window.App?.isMetric || false;
        const depthUnit = isMetric ? 'm' : 'ft';

        let html = `<tr><th>Depth (${depthUnit})</th><th>ATA</th>`;
        this.mixes.forEach(mix => { html += `<th>${mix}% O₂</th>`; });
        html += '</tr>';

        this.depths.forEach(depthFeet => {
            const displayDepth = isMetric ? Math.round(depthFeet * 0.3048) : depthFeet;
            const ata = ((depthFeet + 33) / 33).toFixed(2);
            html += `<tr><td>${displayDepth}</td><td>${ata}</td>`;
            this.mixes.forEach(mix => {
                const po2 = this.calculatePO2(depthFeet, mix);
                html += `<td class="${this.getStatusClass(po2)}">${po2.toFixed(2)}</td>`;
            });
            html += '</tr>';
        });
        table.innerHTML = html;
    },

    init() { this.generateTable(); }
};

window.PO2Table = PO2Table;

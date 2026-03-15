/**
 * Cave Diving Calculator - Main Application
 * Navigation, initialization, and global state management
 */

const App = {
    isMetric: false,
    currentSection: 'units',

    init() {
        this.initNavigation();
        this.initUnitToggle();
        this.initMobileMenu();
        this.initAllModules();

        // Set initial section from hash or default
        const hash = window.location.hash.slice(1);
        if (hash && document.getElementById(hash)) {
            this.showSection(hash);
        }
    },

    initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);

                // Close mobile menu
                document.getElementById('sidebar')?.classList.remove('open');
            });
        });
    },

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.calculator-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;

            // Update nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('active', link.dataset.section === sectionId);
            });

            // Update URL hash
            history.replaceState(null, '', `#${sectionId}`);

            // Re-render dynamic content for this section
            this.refreshSection(sectionId);
        }
    },

    refreshSection(sectionId) {
        switch (sectionId) {
            case 'tanks':
                TankCalculator?.updateDisplay(document.getElementById('tankType')?.value || 'al80');
                break;
            case 'weights':
                WeightCalculator?.updateDisplay();
                break;
            case 'gasplan':
                GasPlan?.updateDisplay();
                break;
            case 'penetration':
                PenetrationCalculator?.updateDisplay();
                break;
            case 'sac':
                SACCalculator?.updateDisplay();
                break;
            case 'nitrox':
                NitroxCalculator?.updateO2Display();
                NitroxCalculator?.updateBestMix();
                break;
            case 'po2':
                PO2Table?.generateTable();
                break;
            case 'checklist':
                EquipmentChecklist?.render();
                break;
        }
    },

    initUnitToggle() {
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const unit = btn.dataset.unit;
                this.isMetric = (unit === 'metric');

                // Update button states
                document.querySelectorAll('.unit-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.unit === unit);
                });

                // Update all unit labels
                this.updateUnitLabels();

                // Refresh current section
                this.refreshSection(this.currentSection);

                // Force update gas plan visuals if they exist
                if (window.GasPlan) window.GasPlan.updateDisplay();

            });
        });
    },

    updateUnitLabels() {
        const pressureUnit = this.isMetric ? 'bar' : 'PSI';
        const depthUnit = this.isMetric ? 'm' : 'ft';
        const weightUnit = this.isMetric ? 'kg' : 'lbs';

        // Update pressure units
        document.querySelectorAll('#tankPressureUnit, #startPressureUnit, #penStartPressureUnit, #sacStartUnit, #sacEndUnit').forEach(el => {
            if (el) el.textContent = pressureUnit;
        });

        // Update depth units
        document.querySelectorAll('#penDepthUnit, #sacDepthUnit, #bestMixDepthUnit, #eadDepthUnit').forEach(el => {
            if (el) el.textContent = depthUnit;
        });

        // Update weight units
        document.querySelectorAll('#bodyWeightUnit').forEach(el => {
            if (el) el.textContent = weightUnit;
        });
    },

    initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
        }
    },

    initAllModules() {
        // Initialize all calculator modules
        UnitConverter?.init();
        TankCalculator?.init();
        WeightCalculator?.init();
        GasPlan?.init();
        PenetrationCalculator?.init();
        SACCalculator?.init();
        NitroxCalculator?.init();
        PO2Table?.init();
        EquipmentChecklist?.init();
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Expose globally
window.App = App;

/**
 * Unit Converter Module
 * Handles conversions between Imperial and Metric units
 */

const UnitConverter = {
    // Conversion constants
    PSI_TO_BAR: 0.0689476,
    FEET_TO_METERS: 0.3048,
    CUFT_TO_LITERS: 28.3168,
    
    // Temperature conversion
    fahrenheitToCelsius(f) {
        return (f - 32) * 5 / 9;
    },
    
    celsiusToFahrenheit(c) {
        return c * 9 / 5 + 32;
    },
    
    // Pressure conversion
    psiToBar(psi) {
        return psi * this.PSI_TO_BAR;
    },
    
    barToPsi(bar) {
        return bar / this.PSI_TO_BAR;
    },
    
    // Depth conversion
    feetToMeters(feet) {
        return feet * this.FEET_TO_METERS;
    },
    
    metersToFeet(meters) {
        return meters / this.FEET_TO_METERS;
    },
    
    // Volume conversion
    cuftToLiters(cuft) {
        return cuft * this.CUFT_TO_LITERS;
    },
    
    litersToCuft(liters) {
        return liters / this.CUFT_TO_LITERS;
    },
    
    // Round to specified decimal places
    round(value, decimals = 2) {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },
    
    // Initialize event listeners
    init() {
        // Pressure: PSI <-> Bar
        const psiInput = document.getElementById('psiInput');
        const barInput = document.getElementById('barInput');
        
        if (psiInput && barInput) {
            psiInput.addEventListener('input', () => {
                const psi = parseFloat(psiInput.value) || 0;
                barInput.value = this.round(this.psiToBar(psi));
            });
            
            barInput.addEventListener('input', () => {
                const bar = parseFloat(barInput.value) || 0;
                psiInput.value = this.round(this.barToPsi(bar));
            });
        }
        
        // Depth: Feet <-> Meters
        const feetInput = document.getElementById('feetInput');
        const metersInput = document.getElementById('metersInput');
        
        if (feetInput && metersInput) {
            feetInput.addEventListener('input', () => {
                const feet = parseFloat(feetInput.value) || 0;
                metersInput.value = this.round(this.feetToMeters(feet));
            });
            
            metersInput.addEventListener('input', () => {
                const meters = parseFloat(metersInput.value) || 0;
                feetInput.value = this.round(this.metersToFeet(meters));
            });
        }
        
        // Volume: ft³ <-> Liters
        const cuftInput = document.getElementById('cuftInput');
        const litersInput = document.getElementById('litersInput');
        
        if (cuftInput && litersInput) {
            cuftInput.addEventListener('input', () => {
                const cuft = parseFloat(cuftInput.value) || 0;
                litersInput.value = this.round(this.cuftToLiters(cuft));
            });
            
            litersInput.addEventListener('input', () => {
                const liters = parseFloat(litersInput.value) || 0;
                cuftInput.value = this.round(this.litersToCuft(liters));
            });
        }
        
        // Temperature: °F <-> °C
        const fahrenheitInput = document.getElementById('fahrenheitInput');
        const celsiusInput = document.getElementById('celsiusInput');
        
        if (fahrenheitInput && celsiusInput) {
            fahrenheitInput.addEventListener('input', () => {
                const f = parseFloat(fahrenheitInput.value) || 0;
                celsiusInput.value = this.round(this.fahrenheitToCelsius(f), 1);
            });
            
            celsiusInput.addEventListener('input', () => {
                const c = parseFloat(celsiusInput.value) || 0;
                fahrenheitInput.value = this.round(this.celsiusToFahrenheit(c), 1);
            });
        }
    }
};

// Export for use in other modules
window.UnitConverter = UnitConverter;

/**
 * Equipment Checklist Module
 * Visual pre-dive checklists for cave diving
 */

const EquipmentChecklist = {
    // Checklist categories with items
    checklists: {
        sidemount: {
            name: 'Sidemount Configuration',
            icon: '🤿',
            items: [
                { id: 'sm1', text: 'Harness adjusted and snug', critical: true },
                { id: 'sm2', text: 'Butt plate / tail plate secure', critical: false },
                { id: 'sm3', text: 'Bungees tension correct', critical: false },
                { id: 'sm4', text: 'D-rings positioned correctly', critical: true },
                { id: 'sm5', text: 'Weight pockets loaded and secured', critical: true },
                { id: 'sm6', text: 'Trim weights positioned', critical: false },
                { id: 'sm7', text: 'Knife accessible', critical: false },
                { id: 'sm8', text: 'Backup lights mounted', critical: true }
            ]
        },
        gas: {
            name: 'Gas System',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10c0-4.4 3.6-8 8-8s8 3.6 8 8v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z"/><circle cx="12" cy="10" r="2"/></svg>',
            items: [
                { id: 't1', text: 'Tanks filled to working pressure', critical: true },
                { id: 't2', text: 'Valves open fully, then ¼ turn back', critical: true },
                { id: 't3', text: 'O-rings inspected (no damage)', critical: true },
                { id: 't4', text: 'Tank bands/bungees secure', critical: true },
                { id: 't5', text: 'Bolt snaps functional', critical: false },
                { id: 't6', text: 'Regulator breathes freely', critical: true },
                { id: 't7', text: 'SPG reads correctly', critical: true },
                { id: 't8', text: 'Analyze gas (Nitrox)', critical: true }
            ]
        },
        regs: {
            name: 'Regulators Check',
            icon: '⚙️',
            items: [
                { id: 'r1', text: 'Primary 2nd stage breathes smooth', critical: true },
                { id: 'r2', text: 'Backup 2nd stage tested', critical: true },
                { id: 'r3', text: 'No free-flows on either', critical: true },
                { id: 'r4', text: 'Hose routing correct', critical: false },
                { id: 'r5', text: 'Necklace bungee on backup', critical: false },
                { id: 'r6', text: 'Inflator connection secure', critical: true },
                { id: 'r7', text: 'No leaks at connections', critical: true }
            ]
        },
        lights: {
            name: 'Lights Check',
            icon: '🔦',
            items: [
                { id: 'l1', text: 'Primary light fully charged', critical: true },
                { id: 'l2', text: 'Primary light burn tested', critical: true },
                { id: 'l3', text: 'Backup light 1 tested', critical: true },
                { id: 'l4', text: 'Backup light 2 tested', critical: true },
                { id: 'l5', text: 'Backup light 3 tested', critical: false },
                { id: 'l6', text: 'Goodman handle secure', critical: false },
                { id: 'l7', text: 'Light cord management', critical: false }
            ]
        },
        line: {
            name: 'Line & Navigation',
            icon: '🧵',
            items: [
                { id: 'n1', text: 'Primary reel loaded (min 100ft)', critical: true },
                { id: 'n2', text: 'Safety reel loaded', critical: true },
                { id: 'n3', text: 'Jump/gap reel(s) ready', critical: false },
                { id: 'n4', text: 'Line arrows available', critical: true },
                { id: 'n5', text: 'Cookies/REM available', critical: true },
                { id: 'n6', text: 'Wet notes + pencil', critical: false },
                { id: 'n7', text: 'Compass functional', critical: false }
            ]
        },
        buddy: {
            name: 'Buddy Check',
            icon: '👥',
            items: [
                { id: 'b1', text: 'Gas plan reviewed together', critical: true },
                { id: 'b2', text: 'Turn pressure agreed', critical: true },
                { id: 'b3', text: 'Max depth/time agreed', critical: true },
                { id: 'b4', text: 'Emergency signals reviewed', critical: true },
                { id: 'b5', text: 'Lost buddy procedure agreed', critical: true },
                { id: 'b6', text: 'Donate regulator identified', critical: true },
                { id: 'b7', text: 'Exit strategy confirmed', critical: true }
            ]
        }
    },

    // Track completed items (stored in localStorage)
    completedItems: {},

    loadState() {
        try {
            const saved = localStorage.getItem('caveDiveChecklist');
            if (saved) {
                this.completedItems = JSON.parse(saved);
            }
        } catch (e) {
            this.completedItems = {};
        }
    },

    saveState() {
        try {
            localStorage.setItem('caveDiveChecklist', JSON.stringify(this.completedItems));
        } catch (e) { }
    },

    toggleItem(id) {
        this.completedItems[id] = !this.completedItems[id];
        this.saveState();
        this.render();
    },

    resetAll() {
        this.completedItems = {};
        this.saveState();
        this.render();
    },

    getProgress(categoryKey) {
        const category = this.checklists[categoryKey];
        if (!category) return { completed: 0, total: 0, percent: 0 };

        const total = category.items.length;
        const completed = category.items.filter(item => this.completedItems[item.id]).length;
        return {
            completed,
            total,
            percent: Math.round((completed / total) * 100)
        };
    },

    render() {
        const container = document.getElementById('checklistContainer');
        if (!container) return;

        let html = '';

        Object.entries(this.checklists).forEach(([key, category]) => {
            const progress = this.getProgress(key);
            const isComplete = progress.percent === 100;

            html += `
                <div class="checklist-card ${isComplete ? 'complete' : ''}">
                    <div class="checklist-header">
                        <span class="checklist-icon">${category.icon}</span>
                        <h3>${category.name}</h3>
                        <div class="checklist-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.percent}%"></div>
                            </div>
                            <span class="progress-text">${progress.completed}/${progress.total}</span>
                        </div>
                    </div>
                    <ul class="checklist-items">
            `;

            category.items.forEach(item => {
                const checked = this.completedItems[item.id];
                html += `
                    <li class="checklist-item ${checked ? 'checked' : ''} ${item.critical ? 'critical' : ''}"
                        onclick="EquipmentChecklist.toggleItem('${item.id}')">
                        <span class="check-box">${checked ? '✓' : ''}</span>
                        <span class="check-text">${item.text}</span>
                        ${item.critical ? '<span class="critical-badge">!</span>' : ''}
                    </li>
                `;
            });

            html += '</ul></div>';
        });

        container.innerHTML = html;
    },

    init() {
        this.loadState();
        this.render();

        // Reset button
        const resetBtn = document.getElementById('resetChecklist');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetAll());
        }
    }
};

window.EquipmentChecklist = EquipmentChecklist;

// Legis Ledger - Knowledge Navigation
// MVP Baseline

let allClaims = [];
let currentThreshold = 0.70;

// Initialize app
async function init() {
    try {
        // Load manifest
        const response = await fetch('data/manifest.json');
        if (!response.ok) throw new Error('Failed to load manifest');
        
        const manifest = await response.json();
        allClaims = manifest.claims;
        
        // Update total count
        document.getElementById('total-count').textContent = allClaims.length;
        
        // Set up slider
        setupSlider();
        
        // Initial render
        filterAndRender(currentThreshold);
        
    } catch (error) {
        console.error('Error loading claims:', error);
        document.getElementById('claims-list').innerHTML = `
            <p class="error">Error loading claims. Please refresh the page.</p>
        `;
    }
}

// Set up slider interaction
function setupSlider() {
    const slider = document.getElementById('threshold');
    const valueDisplay = document.getElementById('threshold-value');
    
    slider.addEventListener('input', (e) => {
        const threshold = parseInt(e.target.value);
        currentThreshold = threshold / 100;
        valueDisplay.textContent = threshold + '%';
        filterAndRender(currentThreshold);
    });
}

// Filter claims by threshold and render
function filterAndRender(threshold) {
    const visible = allClaims.filter(c => c.confidence >= threshold);
    
    // Update count
    document.getElementById('visible-count').textContent = visible.length;
    
    // Render claims
    const container = document.getElementById('claims-list');
    
    if (visible.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No claims meet ${Math.round(threshold * 100)}% threshold</p>
                <p class="hint">Try lowering the confidence threshold</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = visible
        .sort((a, b) => b.confidence - a.confidence) // Highest confidence first
        .map(claim => renderClaim(claim))
        .join('');
}

// Render individual claim card
function renderClaim(claim) {
    const confidencePercent = Math.round(claim.confidence * 100);
    const gradeClass = claim.grade.replace('+', 'plus').toLowerCase();
    
    return `
        <article class="claim" data-confidence="${claim.confidence}">
            <div class="claim-header">
                <h3>${claim.title}</h3>
                <div class="claim-meta">
                    <span class="grade grade-${gradeClass}">${claim.grade}</span>
                    <span class="confidence">${confidencePercent}% confident</span>
                    <span class="domain">${claim.domain}</span>
                </div>
            </div>
            <div class="claim-actions">
                <a href="${claim.file}" class="btn-primary" target="_blank">
                    View Evidence →
                </a>
            </div>
        </article>
    `;
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
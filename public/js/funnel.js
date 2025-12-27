// funnel.js - The Certainty Navigator

class Funnel {
    constructor(containerSelector, claims) {
        this.container = document.querySelector(containerSelector);
        this.allClaims = [...claims]; // ✓ Store original claims (never mutate)
        this.claims = this.allClaims;  // ✓ Working copy
        this.width = 800;
        this.height = 600;
        this.svg = null;
        this.currentThreshold = 0.70;
        this.tooltip = null;
    }
    
    draw() {
        // Create SVG
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', this.height);
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        
        // Draw funnel shape
        this.drawFunnelShape();
        
        // Add labels
        this.drawLabels();
        
        // Position claims
        this.drawClaims();
        
        // Add to container
        this.container.innerHTML = '';
        this.container.appendChild(this.svg);
    }
    
    drawFunnelShape() {
        // V1: Speculation (wide, top)
        const v1 = this.createPath(
            'M 100 50 L 700 50 L 600 200 L 200 200 Z',
            '#FFF9C4', // Light yellow
            'V1: Speculation'
        );
        
        // V2: Testing (middle)
        const v2 = this.createPath(
            'M 200 200 L 600 200 L 500 400 L 300 400 Z',
            '#BBDEFB', // Light blue
            'V2: Testing'
        );
        
        // V3: Confirmed (narrow, bottom)
        const v3 = this.createPath(
            'M 300 400 L 500 400 L 450 550 L 350 550 Z',
            '#C8E6C9', // Light green
            'V3: Confirmed'
        );
        
        this.svg.appendChild(v1);
        this.svg.appendChild(v2);
        this.svg.appendChild(v3);
    }
    
    createPath(d, fill, label) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', fill);
        path.setAttribute('stroke', '#333');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('data-label', label);
        return path;
    }
    
    drawLabels() {
        const labels = [
            { text: 'V1: SPECULATION', x: 400, y: 100, size: 20 },
            { text: '20-50% confidence', x: 400, y: 125, size: 14 },
            { text: 'V2: TESTING', x: 400, y: 280, size: 20 },
            { text: '50-80% confidence', x: 400, y: 305, size: 14 },
            { text: 'V3: CONFIRMED', x: 400, y: 460, size: 20 },
            { text: '80-95% confidence', x: 400, y: 485, size: 14 },
        ];
        
        labels.forEach(label => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', label.x);
            text.setAttribute('y', label.y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', label.size);
            text.setAttribute('fill', '#333');
            text.textContent = label.text;
            this.svg.appendChild(text);
        });
    }
    
    drawClaims() {
        // Create tooltip element if it doesn't exist
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'custom-tooltip';
            document.body.appendChild(this.tooltip);
        }
        
        // Always draw ALL claims, use opacity for filtering
        this.allClaims.forEach((claim, index) => {
            const position = this.getClaimPosition(claim.confidence);
            
            // Draw as circle (dot)
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', position.x);
            circle.setAttribute('cy', position.y);
            circle.setAttribute('r', 8);
            circle.setAttribute('fill', this.getClaimColor(claim.confidence));
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            circle.classList.add('claim-dot');
            circle.dataset.claimId = claim.id;
            
            // Set opacity based on threshold (visible vs faded)
            const isVisible = claim.confidence >= this.currentThreshold;
            circle.style.opacity = isVisible ? '1' : '0.2';
            circle.style.cursor = isVisible ? 'pointer' : 'default';
            
            // Add transition for smooth filtering
            circle.style.transition = 'opacity 0.3s ease, r 0.2s ease, stroke-width 0.2s ease';
            
            // Add native SVG tooltip (fallback for accessibility)
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${claim.title} (${Math.round(claim.confidence * 100)}%)`;
            circle.appendChild(title);
            
            // Add custom tooltip on hover
            circle.addEventListener('mouseenter', (e) => {
                this.showTooltip(claim, e);
            });
            
            circle.addEventListener('mousemove', (e) => {
                this.updateTooltipPosition(e);
            });
            
            circle.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
            
            // Only make visible claims clickable
            if (isVisible) {
                circle.addEventListener('click', () => {
                    const card = document.querySelector(`[data-claim-id="${claim.id}"]`);
                    if (card) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.classList.add('highlight');
                        setTimeout(() => card.classList.remove('highlight'), 2000);
                    }
                });
            }
            
            this.svg.appendChild(circle);
        });
    }

    showTooltip(claim, event) {
        const confidencePercent = Math.round(claim.confidence * 100);
        const gradeDisplay = claim.grade || 'N/A';
        
        this.tooltip.innerHTML = `
            <strong>${claim.title}</strong>
            <div>
                <span class="confidence">${confidencePercent}% confident</span> • 
                <span class="grade">Grade ${gradeDisplay}</span>
            </div>
        `;
        
        this.tooltip.classList.add('visible');
        this.updateTooltipPosition(event);
    }

    updateTooltipPosition(event) {
        const offset = 15;
        this.tooltip.style.left = (event.pageX + offset) + 'px';
        this.tooltip.style.top = (event.pageY + offset) + 'px';
    }

    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }
    
    getClaimPosition(confidence) {
        // Map confidence (0-1) to Y position
        // ✓ HIGHER confidence = LOWER Y (toward bottom of funnel)
        
        // Y range: 50 (top) to 550 (bottom)
        // But we want HIGH confidence at BOTTOM
        const minY = 50;   // Top of funnel
        const maxY = 550;  // Bottom of funnel
        
        // ✓ Invert: confidence 0.0 → Y=50 (top), confidence 1.0 → Y=550 (bottom)
        const y = minY + (confidence * (maxY - minY));
        
        // X position: centered with narrowing toward bottom
        const centerX = 400;
        
        // Calculate spread based on Y position (narrows as we go down)
        const topSpread = 250;    // Wide at top
        const bottomSpread = 50;  // Narrow at bottom
        const normalizedY = (y - minY) / (maxY - minY); // 0-1 from top to bottom
        const spread = topSpread - (normalizedY * (topSpread - bottomSpread));
        
        const x = centerX + (Math.random() - 0.5) * spread;
        
        return { x, y };
    }
    
    getClaimColor(confidence) {
        if (confidence >= 0.80) return '#4CAF50'; // Green
        if (confidence >= 0.50) return '#2196F3'; // Blue
        return '#FFC107'; // Yellow
    }
    
    filterByThreshold(threshold) {
        this.currentThreshold = threshold;
        // ✓ Just re-draw, don't mutate claims array
        this.draw();
    }
}
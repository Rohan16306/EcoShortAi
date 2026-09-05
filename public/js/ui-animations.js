// Global UI Animations for EcoSort

function throwLeaves() {
    for(let i=0; i<40; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf-confetti';
        leaf.style.left = (Math.random() * 100) + 'vw';
        leaf.style.animationDuration = (Math.random() * 3 + 2) + 's';
        leaf.style.animationDelay = (Math.random() * 0.5) + 's';
        leaf.style.filter = `hue-rotate(${Math.random() * 80 - 40}deg)`;
        document.body.appendChild(leaf);
        setTimeout(() => leaf.remove(), 5000);
    }
}

function injectAnimatedBackground() {
    if (!document.getElementById('particles')) {
        const particlesContainer = document.createElement('div');
        particlesContainer.id = 'particles';
        particlesContainer.className = 'particles';
        document.body.insertBefore(particlesContainer, document.body.firstChild);
        
        for(let i=0; i<20; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.width = p.style.height = (Math.random() * 15 + 5) + 'px';
            p.style.left = (Math.random() * 100) + 'vw';
            p.style.top = (Math.random() * 100) + 'vh';
            p.style.animationDuration = (Math.random() * 15 + 10) + 's';
            p.style.animationDelay = (Math.random() * 5) + 's';
            particlesContainer.appendChild(p);
        }
    }

    if (!document.getElementById('clouds')) {
        const cloudsContainer = document.createElement('div');
        cloudsContainer.id = 'clouds';
        cloudsContainer.className = 'clouds-container';
        cloudsContainer.innerHTML = `
            <div class="cloud cloud-1"></div>
            <div class="cloud cloud-2"></div>
            <div class="cloud cloud-3"></div>
        `;
        document.body.insertBefore(cloudsContainer, document.body.firstChild);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Disabled injectAnimatedBackground();
});

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if(menu) menu.classList.toggle('hidden');
}

window.showCreditAnimation = function(amount) {
    if (!amount || amount <= 0) return;

    const overlay = document.getElementById('credit-overlay');
    const modal = document.getElementById('credit-modal');
    const display = document.getElementById('credit-amount-display');

    if (!overlay || !modal || !display) return;

    display.innerText = amount;
    
    // Show overlay
    overlay.style.display = 'flex';
    
    // Trigger transition
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');
        
        modal.classList.remove('scale-50', 'opacity-0');
        modal.classList.add('scale-100', 'opacity-100');
        
        // Fire confetti!
        if (typeof confetti === 'function') {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#22c55e', '#eab308', '#06b6d4'],
                    zIndex: 200
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#22c55e', '#eab308', '#06b6d4'],
                    zIndex: 200
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }

        // Hide after 4 seconds
        setTimeout(() => {
            overlay.classList.remove('opacity-100');
            overlay.classList.add('opacity-0');
            
            modal.classList.remove('scale-100', 'opacity-100');
            modal.classList.add('scale-50', 'opacity-0');
            
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500); // Wait for transition
        }, 4000);

    }, 50);
};
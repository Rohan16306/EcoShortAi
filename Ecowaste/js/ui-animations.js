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
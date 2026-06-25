document.addEventListener('DOMContentLoaded', () => {
    // Scroll Reveal Animation
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        
        // When the class 'visible' is added, it will override the inline styles 
        // due to CSS rules, or we can just apply styles directly:
        observer.observe(el);
    });

    // We also need to add a css rule dynamically for .scroll-reveal.visible
    const style = document.createElement('style');
    style.textContent = `
        .scroll-reveal.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        
        /* Hover 3D Effect */
        .hover-3d {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-3d:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
});

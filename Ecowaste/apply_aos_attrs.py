import re
import os

files = {
    'index.html': 'fade-up',
    'goals-mission.html': 'flip-left',
    'eco-community.html': 'fade-left',
    'impact.html': 'zoom-out',
    'gallery-contact.html': 'zoom-in-up'
}

for filename, aos_attr in files.items():
    if not os.path.exists(filename): continue
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add data-aos to glass-panels that don't have it and are not nav elements
    # We'll look for `<div class="... glass-panel ..."`
    # But wait, index.html has `scroll-reveal`. Let's handle `scroll-reveal` first.
    if filename == 'index.html':
        content = re.sub(r'class="([^"]*)scroll-reveal([^"]*)"', r'class="\1\2" data-aos="fade-up"', content)
        # Also let's stagger features. Let's find testimonial-card and feature-card to stagger.
        # It's easier to just let AOS do it globally without stagger if we use re.sub, or we can just leave it as is.
    else:
        # For other files, we add data-aos to .glass-panel
        def repl(m):
            tag = m.group(1)
            # If it already has data-aos, ignore
            if 'data-aos=' in tag:
                return tag
            return f'{tag} data-aos="{aos_attr}"'
            
        content = re.sub(r'(<div[^>]*class="[^"]*\bglass-panel\b[^"]*"[^>]*)>', repl, content)
        
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {filename}")

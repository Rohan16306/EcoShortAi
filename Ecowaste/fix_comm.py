import re

with open('eco-community.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(
    r'<hr class="my-6 border-emerald-500/20">\s*<label class="block text-sm font-bold text-color-main mb-2">Display Name</label>\s*<input id="my-name".*?>\s*<p class="text-xs text-color-muted mt-2 font-medium">This name will appear on your posts.</p>',
    '',
    html,
    flags=re.DOTALL
)

html = html.replace(
    "const currentUserName = (document.getElementById('my-name') ? document.getElementById('my-name').value.trim() : '') || localStorage.getItem('ecoSortCommunityName') || 'EcoWarrior';",
    """let currentUserName = 'EcoWarrior';
            const storedUserStr = localStorage.getItem('ecoSortUser');
            if (storedUserStr) {
                try {
                    const parsedUser = JSON.parse(storedUserStr);
                    currentUserName = parsedUser.name || parsedUser.email || 'EcoWarrior';
                } catch(e) {}
            }"""
)

html = re.sub(
    r'function initNameField\(\) \{.*?\}(?=\s*function)',
    '',
    html,
    flags=re.DOTALL
)
html = html.replace('initNameField();', '')

html = html.replace(
    "const fallbackName = (document.getElementById('my-name').value || '').trim() || 'EcoWarrior';",
    """let fallbackName = 'EcoWarrior';
                const storedUserStr = localStorage.getItem('ecoSortUser');
                if (storedUserStr) {
                    try {
                        const parsedUser = JSON.parse(storedUserStr);
                        fallbackName = parsedUser.name || parsedUser.email || 'EcoWarrior';
                    } catch(e) {}
                }"""
)

with open('eco-community.html', 'w', encoding='utf-8') as f:
    f.write(html)

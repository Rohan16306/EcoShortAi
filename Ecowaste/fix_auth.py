import os

files_to_update = ['goals-mission.html', 'gallery-contact.html', 'leaderboard.html', 'impact.html', 'eco-community.html']

script_to_inject = """
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const storedUser = localStorage.getItem('ecoSortUser');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser && parsedUser.id) {
                        const authBtns = document.querySelectorAll('a[href="index.html#auth-modal"]');
                        authBtns.forEach(btn => {
                            btn.innerHTML = '<i class="fa-solid fa-user mr-2"></i> ' + (parsedUser.name || 'Dashboard');
                            btn.href = 'index.html';
                            btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                            btn.classList.add('bg-emerald-800', 'hover:bg-emerald-900');
                        });
                    }
                } catch(e) {}
            }
        });
    </script>
</body>
"""

for file in files_to_update:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'ecoSortUser' not in content and '</body>' in content:
            content = content.replace('</body>', script_to_inject)
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
                
print('Injected script')

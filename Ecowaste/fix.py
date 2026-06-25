import sys, re

with open('old-frontend-backup/index.html', 'r', encoding='utf-8') as f:
    old_lines = f.readlines()

community_section = ''.join(old_lines[284:344])
community_section = community_section.replace('<div class="bg-white py-20 border-t border-gray-100">', '<div id="community-section" class="bg-white py-20 border-t border-gray-100">')
community_section = re.sub(r'<a href="community\.html".*?Open Full Community Page\s*</a>', '', community_section, flags=re.DOTALL)

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

if 'id="community-section"' not in index_html:
    index_html = index_html.replace('<!-- Why Plastic Recycling Matters Section -->', community_section + '\n        <!-- Why Plastic Recycling Matters Section -->')

index_html = index_html.replace('<a href="community.html" class="nav-btn', '<button onclick="scrollToSection(\'community-section\')" class="nav-btn')
index_html = index_html.replace('<a href="community.html" class="block', '<button onclick="scrollToSection(\'community-section\')" class="block')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

with open('goals-mission.html', 'r', encoding='utf-8') as f:
    goals_html = f.read()
goals_html = goals_html.replace('href="community.html"', 'href="index.html#community-section"')
with open('goals-mission.html', 'w', encoding='utf-8') as f:
    f.write(goals_html)
print('Done!')

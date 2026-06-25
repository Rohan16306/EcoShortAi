import re

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

# Remove the community section
index_html = re.sub(r'<div id="community-section".*?(?=<!-- Why Plastic Recycling Matters Section -->)', '', index_html, flags=re.DOTALL)

# Revert links back to a tags
index_html = index_html.replace('<button onclick="scrollToSection(\'community-section\')" class="nav-btn', '<a href="community.html" class="nav-btn')
index_html = index_html.replace('Community</button>', 'Community</a>')

# The mobile block link
index_html = index_html.replace('<button onclick="scrollToSection(\'community-section\')" class="block', '<a href="community.html" class="block')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(index_html)

with open('goals-mission.html', 'r', encoding='utf-8') as f:
    goals_html = f.read()

goals_html = goals_html.replace('href="index.html#community-section"', 'href="community.html"')

with open('goals-mission.html', 'w', encoding='utf-8') as f:
    f.write(goals_html)

print('Reverted.')

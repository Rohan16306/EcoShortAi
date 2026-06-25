import re
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'src="js/app\.js(\?v=\d+)?"', 'src="js/app.js?v=2"', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html cache buster")

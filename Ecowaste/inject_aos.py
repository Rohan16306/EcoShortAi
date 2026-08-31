import os
import glob

html_files = glob.glob('*.html')

aos_css = '    <link rel="stylesheet" href="https://unpkg.com/aos@next/dist/aos.css" />\n'
aos_js = '    <script src="https://unpkg.com/aos@next/dist/aos.js"></script>\n    <script>AOS.init({ duration: 800, once: true, offset: 100 });</script>\n'

for file in html_files:
    encoding = 'utf-8'
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        encoding = 'utf-16'
        with open(file, 'r', encoding='utf-16') as f:
            content = f.read()
            
    if 'aos.css' in content:
        print(f"Skipping {file} (already has AOS)")
        continue
        
    # Inject CSS before </head>
    content = content.replace('</head>', aos_css + '</head>')
    
    # Inject JS before </body>
    content = content.replace('</body>', aos_js + '</body>')
    
    with open(file, 'w', encoding=encoding) as f:
        f.write(content)
    print(f"Injected AOS into {file}")

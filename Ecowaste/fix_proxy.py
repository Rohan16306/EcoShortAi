with open('server.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = '''const phase2Proxy = createProxyMiddleware({ 
    target: 'http://localhost:3000', 
    changeOrigin: true,
    ws: true 
  });'''

replacement = '''const phase2Proxy = createProxyMiddleware({ 
    target: 'http://localhost:3005', 
    changeOrigin: true,
    ws: true 
  });'''

if 'http://localhost:3000' in target:
    js = js.replace(target, replacement)
    with open('server.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('Updated server.js phase2Proxy')
else:
    print('Target not found in server.js')

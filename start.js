const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';

console.log('🚀 Starting EcoSort AI Hybrid Environment (Vanilla HTML)...');
console.log(`📦 Phase 2 mode: ${isDev ? 'DEVELOPMENT (Turbopack HMR)' : 'PRODUCTION (pre-compiled)'}`);

// 1. Start PocketBase
const pbPath = path.join(__dirname, 'backend-pb');
const pbExecutable = process.platform === 'win32' ? '.\\pocketbase.exe' : './pocketbase';

const pbProcess = spawn(pbExecutable, ['serve'], { 
    cwd: pbPath, 
    shell: true, 
    stdio: ['ignore', 'pipe', 'pipe']
});

pbProcess.stdout.on('data', () => {}); // Suppress verbose PocketBase output
pbProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) console.error(`[PocketBase Error] ${msg}`);
});

console.log('⏳ Waiting 2 seconds for PocketBase to initialize on port 8090...');

setTimeout(() => {
    // 2. Run Seed Admin Script
    console.log('\n🌱 Running Admin Seeder...');
    try {
        execSync('node seed-admin.js', { cwd: pbPath, stdio: 'inherit' });
    } catch (err) {
        console.error('⚠️  Warning: Admin seeder failed. PocketBase might not be ready yet.');
    }

    // 3. Start Node.js Server (Phase 1 static files)
    console.log('\n🌐 Starting Node.js Server (Phase 1)...');
    const nodeProcess = spawn('node', ['server.js'], { 
        cwd: __dirname, 
        shell: true, 
        stdio: 'inherit',
        env: { ...process.env }
    });

    // Handle cleanup on exit
    function cleanup() {
        console.log('\n🛑 Shutting down all servers...');
        if (pbProcess) pbProcess.kill();
        if (nodeProcess) nodeProcess.kill();
        process.exit();
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

}, 2000);


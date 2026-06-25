const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting EcoSort AI Hybrid Environment (Vanilla HTML)...');

// 1. Start PocketBase
const pbPath = path.join(__dirname, 'backend-pb');
// Use the correct executable for the OS
const pbExecutable = process.platform === 'win32' ? '.\\pocketbase.exe' : './pocketbase';

const pbProcess = spawn(pbExecutable, ['serve'], { 
    cwd: pbPath, 
    shell: true, 
    stdio: ['ignore', 'pipe', 'pipe'] // Pipe output to filter it if we want, or just ignore stdin
});

pbProcess.stdout.on('data', (data) => {
    // Optional: console.log(`[PocketBase] ${data.toString().trim()}`);
});

pbProcess.stderr.on('data', (data) => {
    console.error(`[PocketBase Error] ${data.toString().trim()}`);
});

console.log('⏳ Waiting 2 seconds for PocketBase to initialize on port 8090...');

// Wait 2 seconds for PocketBase to bind to port 8090
setTimeout(() => {
    // 2. Run Seed Admin Script
    console.log('\n🌱 Running Admin Seeder...');
    try {
        execSync('node seed-admin.js', { cwd: pbPath, stdio: 'inherit' });
    } catch (err) {
        console.error('⚠️ Warning: Admin seeder failed. PocketBase might not be ready yet.');
    }

    // 3. Start Node.js Server
    console.log('\n🌐 Starting Node.js Server...');
    const nodeProcess = spawn('node', ['server.js'], { 
        cwd: __dirname, 
        shell: true, 
        stdio: 'inherit' 
    });

    // 4. Start Next.js Frontend (Phase 1)
    console.log('\n⚛️ Starting Next.js Frontend (Phase 1)...');
    const phase1Path = path.join(__dirname, 'frontend-next');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const phase1Process = spawn(npmCmd, ['run', 'dev'], { 
        cwd: phase1Path, 
        shell: true, 
        stdio: 'inherit' 
    });

    // 5. Start Next.js Frontend (Phase 2)
    console.log('\n🚀 Starting Next.js Frontend (Phase 2)...');
    const phase2Path = path.join(__dirname, 'Phase2');
    const phase2Process = spawn(npmCmd, ['run', 'dev'], { 
        cwd: phase2Path, 
        shell: true, 
        stdio: 'inherit' 
    });

    // Handle cleanup on exit
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down servers...');
        pbProcess.kill();
        nodeProcess.kill();
        phase1Process.kill();
        phase2Process.kill();
        process.exit();
    });

    process.on('SIGTERM', () => {
        pbProcess.kill();
        nodeProcess.kill();
        phase1Process.kill();
        phase2Process.kill();
        process.exit();
    });

}, 2000);

const fs = require('fs');
const path = require('path');

const files = ['goals-mission.html', 'gallery-contact.html', 'leaderboard.html', 'impact.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace <a href="index.html"> with the parent router call
    const originalHref = /href=["']index\.html["']/g;
    const replacementHref = 'href="javascript:void(0)" onclick="if(window.parent && window.parent.router) { window.parent.router(\'home\'); } else { window.location.href=\'index.html\'; }"';
    
    if (originalHref.test(content)) {
        content = content.replace(originalHref, replacementHref);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});

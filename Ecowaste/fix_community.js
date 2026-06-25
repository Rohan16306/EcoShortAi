const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'index.html');
const communityFile = path.join(__dirname, 'community.html');

let indexHtml = fs.readFileSync(indexFile, 'utf8');
let communityHtml = fs.readFileSync(communityFile, 'utf8');

// 1. Change nav links in index.html
indexHtml = indexHtml.replace(
    /<a href="community\.html"([^>]*)>Community<\/a>/g,
    '<button onclick="router(\'community\')" $1>Community</button>'
);

// 2. Extract community grid from community.html
const startTag = '<section class="community-grid">';
const startIndex = communityHtml.indexOf(startTag);
// Find the closing </section> for this section
// It's the one before the closing </main> or script tags.
// Let's use regex or string matching.
const endString = '</section>';
let endIndex = communityHtml.indexOf(endString, startIndex);
// We need to make sure we got the right </section>. Let's just find where <script> starts because the grid is the last thing before <script>.
// Actually, in community.html:
// <section class="community-grid"> ... </section>
// </main> -- wait, main is inside the section.
// Let's use a simple regex or string slice up to </section> before <script src="js/app.js">
let communityGrid = communityHtml.substring(startIndex, endIndex + endString.length);

if (!communityGrid) {
    console.error("Could not find community grid");
    process.exit(1);
}

// 3. Check if view-community already exists
if (indexHtml.includes('id="view-community"')) {
    console.log("view-community already exists. Skipping insertion.");
} else {
    // 4. Inject view-community right before <!-- Modals -->
    const modalsMarker = '<!-- Modals -->';
    const injection = `
    <!-- VIEW: COMMUNITY -->
    <section id="view-community" class="view-section pt-16 hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            ${communityGrid}
        </div>
    </section>

    `;
    indexHtml = indexHtml.replace(modalsMarker, injection + modalsMarker);
}

// 5. We also need the CSS styles from community.html.
// Let's extract the <style> block from community.html and put it in index.html's <head>
const styleStart = '<style>';
const styleEnd = '</style>';
const sIdx = communityHtml.indexOf(styleStart);
const eIdx = communityHtml.indexOf(styleEnd, sIdx);
if (sIdx !== -1 && eIdx !== -1) {
    const styles = communityHtml.substring(sIdx + styleStart.length, eIdx);
    // Insert styles before </head> in index.html if not already there
    if (!indexHtml.includes('community-grid')) {
        indexHtml = indexHtml.replace('</head>', `<style>${styles}</style>\n</head>`);
    }
}

fs.writeFileSync(indexFile, indexHtml, 'utf8');
console.log("Successfully embedded community view into index.html!");

const fs = require('fs');
const path = require('path');

console.log('🔨 Building Steno-Web (100% Client-Side)...\n');

// Clean dist
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Copy all files from public to dist
const files = fs.readdirSync('public');
files.forEach(file => {
  fs.copyFileSync(
    path.join('public', file),
    path.join('dist', file)
  );
  console.log(`✓ ${file}`);
});

// Create Netlify config
const netlifyToml = `[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
fs.writeFileSync('dist/netlify.toml', netlifyToml);
console.log('✓ netlify.toml');

// Create _redirects
fs.writeFileSync('dist/_redirects', '/*    /index.html   200');
console.log('✓ _redirects');

// Create README
const readme = `# Steno-Web - Static Build

## 🚀 Deploy to Netlify

**Option 1: Drag & Drop (Easiest)**
1. Go to https://app.netlify.com/drop
2. Drag this entire \`dist\` folder
3. Done! Your app is live!

**Option 2: Netlify CLI**
\`\`\`bash
npm install -g netlify-cli
netlify deploy --prod
\`\`\`

**Option 3: Git Integration**
1. Push this folder to GitHub
2. Connect to Netlify
3. Auto-deploy!

## 📦 What's Inside

- 100% client-side - no server needed
- LSB steganography using Canvas API
- Complete privacy - nothing leaves your browser
- Works on any static host

## ✨ Also works on:
- Vercel
- GitHub Pages
- Cloudflare Pages
- Any static hosting!
`;
fs.writeFileSync('dist/README.md', readme);
console.log('✓ README.md');

console.log('\n✅ Build complete!\n');
console.log('📦 Files ready in dist/ folder');
console.log('📊 Size:', Math.round(fs.readdirSync('dist').reduce((acc, f) => {
  return acc + fs.statSync(path.join('dist', f)).size;
}, 0) / 1024), 'KB\n');
console.log('🚀 Deploy to Netlify:');
console.log('   https://app.netlify.com/drop\n');

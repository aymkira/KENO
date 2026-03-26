const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'node_modules', 'ayman-fca', 'package.json');

if (!fs.existsSync(pkgPath)) {
    console.log('ayman-fca not found, skipping fix');
    process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

pkg.main = 'module/login.js';
pkg.exports = {
    '.': {
        'require': './module/login.js',
        'default': './module/login.js'
    },
    './src/utils/sessionKeeper': {
        'require': './src/utils/sessionKeeper.js',
        'default': './src/utils/sessionKeeper.js'
    },
    './module/login': {
        'require': './module/login.js',
        'default': './module/login.js'
    }
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('✅ ayman-fca package.json fixed!');

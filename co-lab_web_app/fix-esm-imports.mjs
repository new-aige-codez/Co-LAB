// fix-esm-imports.mjs — Post-SWC build: add .js extensions to relative imports
// Usage: node fix-esm-imports.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';

const distDir = resolve('dist');

function walk(dir) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walk(full));
        else if (entry.name.endsWith('.js')) files.push(full);
    }
    return files;
}

const importPatterns = [
    /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,           // import { x } from './foo'
    /(import\s*\(\s*['"])(\.\.?\/[^'"]+)(['"]\s*\))/g, // import('./foo')
];

let fixCount = 0;
const jsFiles = walk(distDir);

for (const file of jsFiles) {
    let content = readFileSync(file, 'utf8');
    const dir = dirname(file);
    let changed = false;

    for (const pattern of importPatterns) {
        // Reset lastIndex for global regex
        pattern.lastIndex = 0;
        content = content.replace(pattern, (match, pre, importPath, post) => {
            if (importPath.endsWith('.js') || importPath.endsWith('.json')) return match;
            const absPath = resolve(dir, importPath);
            if (existsSync(absPath + '.js')) {
                fixCount++;
                changed = true;
                return pre + importPath + '.js' + post;
            }
            if (existsSync(join(absPath, 'index.js'))) {
                fixCount++;
                changed = true;
                return pre + importPath + '/index.js' + post;
            }
            console.log('  WARN: unresolved import in ' + file + ': ' + importPath);
            return match;
        });
    }

    if (changed) writeFileSync(file, content);
}

console.log('Fixed ' + fixCount + ' imports across ' + jsFiles.length + ' files');

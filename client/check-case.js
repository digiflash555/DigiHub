import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, 'src');

function getFiles(dir) {
    const files = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            files.push(...getFiles(fullPath));
        } else if (dirent.name.endsWith('.js') || dirent.name.endsWith('.jsx')) {
            files.push(fullPath);
        }
    });
    return files;
}

const allFiles = getFiles(srcDir);

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /import\s+.*?from\s+['"]([\.\/].*?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        let resolvedPath = path.resolve(path.dirname(file), importPath);
        
        // Check exact match by walking directory
        const parts = path.relative(srcDir, resolvedPath).split(path.sep);
        if (parts.length > 0 && parts[0] === '..') continue; // Outside src, skip
        
        let currentDir = srcDir;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            let children;
            try {
                children = fs.readdirSync(currentDir);
            } catch (e) {
                break;
            }
            
            // If it's the last part, it might not have an extension in the import
            if (i === parts.length - 1) {
                const possibleMatches = [part, part + '.js', part + '.jsx'];
                let exactMatch = children.find(c => possibleMatches.includes(c));
                
                if (!exactMatch) {
                    // check if it's a directory with index
                    const exactFolder = children.find(c => c === part);
                    if (exactFolder) {
                        try {
                            if (fs.statSync(path.join(currentDir, exactFolder)).isDirectory()) {
                                exactMatch = true;
                            }
                        } catch(e) {}
                    }
                }

                if (!exactMatch) {
                    // Check if it exists case-insensitively
                    const lowerMatch = children.find(c => c.toLowerCase() === part.toLowerCase() || c.toLowerCase() === part.toLowerCase() + '.js' || c.toLowerCase() === part.toLowerCase() + '.jsx');
                    if (lowerMatch) {
                        console.log(`CASE MISMATCH in ${file}:`);
                        console.log(`  Imported: ${importPath} (Part: ${part})`);
                        console.log(`  Actual: ${lowerMatch}`);
                    } else {
                        const lowerFolder = children.find(c => c.toLowerCase() === part.toLowerCase());
                        if (lowerFolder) {
                             console.log(`CASE MISMATCH in ${file}:`);
                             console.log(`  Imported folder: ${importPath} (Part: ${part})`);
                             console.log(`  Actual folder: ${lowerFolder}`);
                        }
                    }
                }
            } else {
                const exactMatch = children.find(c => c === part);
                if (!exactMatch) {
                    const lowerMatch = children.find(c => c.toLowerCase() === part.toLowerCase());
                    if (lowerMatch) {
                        console.log(`CASE MISMATCH in ${file}:`);
                        console.log(`  Imported directory: ${part} in ${importPath}`);
                        console.log(`  Actual directory: ${lowerMatch}`);
                        break; // Stop checking this import
                    } else {
                        break; // Not found at all, skip
                    }
                } else {
                    currentDir = path.join(currentDir, exactMatch);
                }
            }
        }
    }
});

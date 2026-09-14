const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('d:/MiniProject/Event_Management_System/client/src');
let updated = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    const regex = /<label([^>]*)className=["']([^"']*)["']([^>]*)>/g;
    content = content.replace(regex, (match, before, className, after) => {
        if (className.includes('text-slate-400') && !className.includes('dark:text-slate-400')) {
            const newClassName = className.replace(/\btext-slate-400\b/g, 'text-slate-900 dark:text-slate-400');
            changed = true;
            return '<label' + before + 'className="' + newClassName + '"' + after + '>';
        }
        return match;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
        updated++;
    }
});

console.log('Total files updated:', updated);

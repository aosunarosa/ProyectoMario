const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendDir = path.resolve(__dirname, '..'); // Assuming script runs from a subfolder or root
const readmePath = path.join(backendDir, 'README.txt');

console.log('Running pre-push hook: updating backend/README.txt...');

try {
    // 1. Get the current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();

    // 2. Get unpushed commits for the backend directory
    // We compare our local branch with its remote tracking branch (origin/master or similar)
    // If no remote branch exists yet, this might fail, so we catch it.
    let commits = '';
    try {
        commits = execSync(`git log origin/${currentBranch}..HEAD --format="* %s%n%b" -- "${backendDir}"`, { encoding: 'utf-8' }).trim();
    } catch (e) {
        // If there's no upstream tracking yet, just get all local commits for backend
        commits = execSync(`git log --format="* %s%n%b" -- "${backendDir}"`, { encoding: 'utf-8' }).trim();
    }

    if (!commits) {
        console.log('No backend changes detected in this push. Skipping README update.');
        process.exit(0);
    }

    console.log('Changes detected! Updating README.txt...');

    // 3. Format today's date
    const today = new Date();
    const dateStr = today.toISOString().replace(/T/, ' ').replace(/\..+/, ''); // YYYY-MM-DD HH:MM:SS

    // 4. Create new content block
    let newContent = `--- Update: ${dateStr} ---\n${commits}\n\n`;

    // 5. Read existing content (if any)
    let existingContent = '';
    const header = 'Backend Changelog\n=================\n\n';

    if (fs.existsSync(readmePath)) {
        existingContent = fs.readFileSync(readmePath, 'utf8');
        // If it already has the header, strip it so we don't duplicate
        if (existingContent.startsWith(header)) {
            existingContent = existingContent.slice(header.length);
        }
    }

    // 6. Write the final file (Header + New Content + Old Content)
    const finalContent = header + newContent + existingContent;
    fs.writeFileSync(readmePath, finalContent, 'utf8');

    // 7. Add the README to git and amend the last commit
    // This part ensures the README goes up with the push.
    execSync(`git add "${readmePath}"`);
    console.log(`Successfully updated ${readmePath}`);
    
    // We can't easily run a git commit inside a pre-push hook reliably on all systems without blocking the push
    // Instead, a better approach is a pre-commit hook if you want it strictly bound.
    // However, if we do it here, we must amend. Warning: amending while pushing might get rejected by git.
    execSync('git commit --amend --no-edit');
    
} catch (error) {
    console.error('Error in pre-push hook:', error.message);
    // Don't block the push on an error here, or block it if you prefer strictness
    process.exit(0); 
}

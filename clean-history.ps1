# PowerShell script to clean Git history of sensitive files
Write-Host "Cleaning Git history of sensitive files..."

# Remove the sensitive files from all commits
git filter-branch --force --index-filter `
    "git rm --cached --ignore-unmatch scripts/fix-env-manual.js scripts/fix-env.js" `
    --prune-empty --tag-name-filter cat -- --all

Write-Host "History cleaned. Now force push to remote..."
git push --force

Write-Host "Done!" 
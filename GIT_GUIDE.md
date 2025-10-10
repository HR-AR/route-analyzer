# Git Guide for Beginners 🚀

This guide will help you set up and use Git for this project, even if you've never used Git before.

## What is Git?

**Git** is like a "save game" system for your code. It:
- Saves different versions of your project
- Lets you go back to earlier versions if something breaks
- Helps multiple people work on the same project
- Keeps a history of all changes made

Think of it like Track Changes in Microsoft Word, but much more powerful!

---

## Step 1: Install Git (If Not Already Installed)

### Check if Git is Installed

Open Terminal and type:
```bash
git --version
```

If you see something like `git version 2.x.x`, you're good! Skip to Step 2.

### Install Git (if needed)

**On Mac**:
```bash
# This will prompt you to install if not present
git --version
```

**Or download from**: https://git-scm.com/download/mac

---

## Step 2: Configure Git (First Time Only)

Tell Git who you are:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@walmart.com"
```

**Example**:
```bash
git config --global user.name "John Smith"
git config --global user.email "john.smith@walmart.com"
```

---

## Step 3: Initialize Git in Your Project

Navigate to your project folder:

```bash
cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis"
```

Initialize Git (creates a `.git` folder to track changes):

```bash
git init
```

You should see: `Initialized empty Git repository`

---

## Step 4: Understanding .gitignore

The `.gitignore` file tells Git which files to **NOT** track. This is important because:

- **Email templates** - Internal communications
- **CSV data files** - May contain sensitive information
- **Generated reports** - Can be recreated anytime
- **node_modules** - Can be reinstalled with `npm install`

**Already created for you**: `.gitignore` is set up to exclude all sensitive files.

---

## Step 5: Add Files to Git

### See What Files Are Untracked

```bash
git status
```

This shows you what Git sees:
- **Red files** = Not tracked yet
- **Green files** = Ready to be saved

### Add Files to Track

**Add all files** (respects .gitignore):
```bash
git add .
```

**Or add specific files**:
```bash
git add README.md
git add my-new-project/src/ui-server.ts
```

### Check Status Again

```bash
git status
```

Files should now be **green** (ready to commit).

---

## Step 6: Save Your Changes (Commit)

A **commit** is like clicking "Save" with a description of what you changed.

```bash
git commit -m "Initial commit: Route Analysis Dashboard v1.0"
```

The message in quotes should describe what you did.

**Good commit messages**:
- ✅ "Add failed pickups analysis feature"
- ✅ "Fix store analysis NoneType error"
- ✅ "Update README with installation instructions"

**Bad commit messages**:
- ❌ "stuff"
- ❌ "changes"
- ❌ "asdf"

---

## Step 7: View Your History

See all your commits:

```bash
git log
```

**Short version**:
```bash
git log --oneline
```

Press `q` to exit the log view.

---

## Step 8: Working with Branches (Optional But Recommended)

**Branches** let you work on new features without affecting the working code.

### Create a New Branch

```bash
git branch feature/new-analysis
```

### Switch to That Branch

```bash
git checkout feature/new-analysis
```

**Or do both at once**:
```bash
git checkout -b feature/new-analysis
```

### See All Branches

```bash
git branch
```

The branch with `*` is your current branch.

### Switch Back to Main Branch

```bash
git checkout main
```

---

## Step 9: Common Git Workflows

### Daily Workflow

```bash
# 1. Start your day - see what changed
git status

# 2. Make your code changes
# (edit files in your code editor)

# 3. See what you changed
git diff

# 4. Add your changes
git add .

# 5. Save your changes
git commit -m "Describe what you did"

# 6. View history
git log --oneline
```

### Feature Workflow

```bash
# 1. Create a new branch for your feature
git checkout -b feature/email-notifications

# 2. Make your changes and commit
git add .
git commit -m "Add email notification system"

# 3. Switch back to main
git checkout main

# 4. Merge your feature
git merge feature/email-notifications

# 5. Delete the feature branch (optional)
git branch -d feature/email-notifications
```

---

## Step 10: Uploading to GitHub (Optional)

If you want to store your code online or share with others:

### Create a GitHub Repository

1. Go to https://github.com
2. Click "+" in top right → "New repository"
3. Name it "route-analysis-dashboard"
4. **Don't** check "Initialize with README" (we already have one)
5. Click "Create repository"

### Link Your Local Git to GitHub

GitHub will show you commands. They'll look like this:

```bash
git remote add origin https://github.com/YOUR-USERNAME/route-analysis-dashboard.git
git branch -M main
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

### Push Future Changes

```bash
git push
```

That's it! Your changes are now on GitHub.

---

## Common Git Commands Quick Reference

```bash
# See status
git status

# See changes
git diff

# Add all files
git add .

# Add specific file
git add filename.txt

# Commit changes
git commit -m "Your message here"

# View history
git log
git log --oneline

# Create branch
git branch branch-name

# Switch branch
git checkout branch-name

# Create and switch to branch
git checkout -b branch-name

# Merge branch into current branch
git merge branch-name

# See all branches
git branch

# Delete branch
git branch -d branch-name

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (CAREFUL!)
git reset --hard HEAD
```

---

## What Files Are Being Tracked?

Based on the `.gitignore` file, Git will track:

### ✅ **WILL BE TRACKED** (saved in Git):
- All Python code files (`.py`)
- All TypeScript code files (`.ts`)
- Configuration files (`package.json`, `tsconfig.json`)
- Documentation files (`.md`)
- Python `requirements.txt`

### ❌ **WILL NOT BE TRACKED** (excluded from Git):
- Email template (`EMAIL_TEMPLATE.md`)
- CSV data files (`*.csv`)
- Generated reports (`*-report.txt`, `*-data.json`)
- Uploaded files (`uploads/` folder)
- Python virtual environment (`venv/`)
- Node modules (`node_modules/`)
- Log files (`*.log`)
- Build files (`dist/`)

---

## Troubleshooting

### "I accidentally committed a file I didn't want to"

**Remove from next commit** (file stays on disk):
```bash
git reset HEAD filename.txt
```

**Remove from Git completely** (file stays on disk):
```bash
git rm --cached filename.txt
git commit -m "Remove sensitive file"
```

### "I want to undo my last commit"

**Keep the changes** (just undo the commit):
```bash
git reset --soft HEAD~1
```

**Discard the changes completely** (CAREFUL!):
```bash
git reset --hard HEAD~1
```

### "I want to see what changed in a specific commit"

```bash
git show COMMIT-HASH
```

Get the COMMIT-HASH from `git log`.

### "I made changes but want to throw them away"

**Specific file**:
```bash
git checkout -- filename.txt
```

**All files** (CAREFUL!):
```bash
git reset --hard HEAD
```

---

## Best Practices

1. **Commit Often**
   - Commit every time you complete a small task
   - Better to have many small commits than one huge one

2. **Write Good Commit Messages**
   - First line: Short summary (50 characters or less)
   - Blank line
   - Detailed description if needed

3. **Use Branches for Features**
   - Keep `main` branch stable
   - Create branches for new features or experiments

4. **Check Status Before Committing**
   - Run `git status` to see what you're about to commit
   - Make sure you're not committing unwanted files

5. **Pull Before Push** (if using GitHub with others)
   ```bash
   git pull
   git push
   ```

---

## Complete First-Time Setup Example

Here's everything in order for someone who's never used Git:

```bash
# 1. Navigate to project
cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis"

# 2. Configure Git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@walmart.com"

# 3. Initialize Git
git init

# 4. See what files exist
git status

# 5. Add all files (respects .gitignore)
git add .

# 6. Check what's staged
git status

# 7. Create first commit
git commit -m "Initial commit: Route Analysis Dashboard v1.0"

# 8. View your commit
git log

# Done! Your project is now version controlled.
```

---

## Next Steps

Now that you have Git set up:

1. ✅ **Make changes** to your code
2. ✅ **Add and commit** regularly
3. ✅ **Use branches** for new features
4. ✅ **Push to GitHub** (optional) for backup
5. ✅ **Review history** to see your progress

**Remember**: Git is a safety net. Don't be afraid to experiment - you can always go back!

---

## Need Help?

- **See what Git sees**: `git status`
- **See what changed**: `git diff`
- **See history**: `git log`
- **Get help on any command**: `git help COMMAND` (e.g., `git help commit`)

**Visual Git Tools** (easier than command line):
- GitHub Desktop: https://desktop.github.com/
- GitKraken: https://www.gitkraken.com/
- SourceTree: https://www.sourcetreeapp.com/

---

You're now ready to use Git! Start with the basics and gradually add more advanced techniques as you get comfortable. 🎉

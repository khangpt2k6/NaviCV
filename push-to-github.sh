#!/bin/bash

# NaviCV GitHub Push Script
# This script helps you push your code to GitHub while removing heavy files

echo "🚀 NaviCV GitHub Push Script"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Initializing..."
    git init
fi

# Remove heavy files and directories
echo "🧹 Cleaning up heavy files..."

# Remove Python cache files
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true
find . -name "*.pyo" -delete 2>/dev/null || true

# Remove virtual environments
find . -type d -name "venv" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "env" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".venv" -exec rm -rf {} + 2>/dev/null || true

# Remove node_modules
find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true

# Remove environment files
find . -name ".env" -delete 2>/dev/null || true
find . -name ".env.local" -delete 2>/dev/null || true

# Remove build directories
find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "build" -exec rm -rf {} + 2>/dev/null || true

# Remove logs
find . -name "*.log" -delete 2>/dev/null || true

echo "✅ Cleanup completed!"

# Check git status
echo "📊 Git status:"
git status --porcelain

# Add all files
echo "📁 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
else
    # Get commit message from user
    echo "💬 Enter commit message (or press Enter for default):"
    read -r commit_message
    
    if [ -z "$commit_message" ]; then
        commit_message="feat: Add NaviCV AI-powered career assistant with multi-source job fetching"
    fi
    
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "$commit_message"
    
    # Check if remote exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        echo "🌐 No remote repository found."
        echo "Please add your GitHub repository URL:"
        echo "Example: https://github.com/yourusername/NaviCV.git"
        read -r remote_url
        
        if [ -n "$remote_url" ]; then
            git remote add origin "$remote_url"
        else
            echo "❌ No remote URL provided. Exiting..."
            exit 1
        fi
    fi
    
    # Push to GitHub
    echo "🚀 Pushing to GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo "🌐 Your repository should be available at:"
        git remote get-url origin
    else
        echo "❌ Failed to push to GitHub. Please check your credentials and try again."
    fi
fi

echo ""
echo "🎉 Script completed!"
echo ""
echo "📋 Next steps:"
echo "1. Verify your code is on GitHub"
echo "2. Set up environment variables in your deployment platform"
echo "3. Configure Firebase services"
echo "4. Deploy your application"
echo ""
echo "📚 For more information, check the README.md file"

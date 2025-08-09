@echo off
REM NaviCV GitHub Push Script for Windows
REM This script helps you push your code to GitHub while removing heavy files

echo 🚀 NaviCV GitHub Push Script
echo ==============================

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Initializing...
    git init
)

REM Remove heavy files and directories
echo 🧹 Cleaning up heavy files...

REM Remove Python cache files
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /r . %%f in (*.pyc) do @if exist "%%f" del "%%f" 2>nul
for /r . %%f in (*.pyo) do @if exist "%%f" del "%%f" 2>nul

REM Remove virtual environments
for /d /r . %%d in (venv) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r . %%d in (env) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r . %%d in (.venv) do @if exist "%%d" rd /s /q "%%d" 2>nul

REM Remove node_modules
for /d /r . %%d in (node_modules) do @if exist "%%d" rd /s /q "%%d" 2>nul

REM Remove environment files
if exist ".env" del ".env" 2>nul
if exist ".env.local" del ".env.local" 2>nul

REM Remove build directories
for /d /r . %%d in (dist) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r . %%d in (build) do @if exist "%%d" rd /s /q "%%d" 2>nul

REM Remove logs
for /r . %%f in (*.log) do @if exist "%%f" del "%%f" 2>nul

echo ✅ Cleanup completed!

REM Check git status
echo 📊 Git status:
git status --porcelain

REM Add all files
echo 📁 Adding files to git...
git add .

REM Check if there are changes to commit
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo ℹ️  No changes to commit
    goto :end
)

REM Get commit message from user
echo 💬 Enter commit message (or press Enter for default):
set /p commit_message=

if "%commit_message%"=="" (
    set commit_message=feat: Add NaviCV AI-powered career assistant with multi-source job fetching
)

REM Commit changes
echo 💾 Committing changes...
git commit -m "%commit_message%"

REM Check if remote exists
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo 🌐 No remote repository found.
    echo Please add your GitHub repository URL:
    echo Example: https://github.com/yourusername/NaviCV.git
    set /p remote_url=
    
    if not "%remote_url%"=="" (
        git remote add origin "%remote_url%"
    ) else (
        echo ❌ No remote URL provided. Exiting...
        exit /b 1
    )
)

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo ✅ Successfully pushed to GitHub!
    echo 🌐 Your repository should be available at:
    git remote get-url origin
) else (
    echo ❌ Failed to push to GitHub. Please check your credentials and try again.
)

:end
echo.
echo 🎉 Script completed!
echo.
echo 📋 Next steps:
echo 1. Verify your code is on GitHub
echo 2. Set up environment variables in your deployment platform
echo 3. Configure Firebase services
echo 4. Deploy your application
echo.
echo 📚 For more information, check the README.md file

pause

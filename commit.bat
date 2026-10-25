@echo off
cd /d "%~dp0"

git checkout -B test
git add .
git commit -m "test: add backend service unit tests and Maestro auth flows" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -u origin test

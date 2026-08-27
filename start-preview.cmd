@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node.js 20.19 or newer, then run this file again.
  pause
  exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
  where corepack >nul 2>&1
  if errorlevel 1 (
    echo pnpm was not found.
    echo Install pnpm, then run this file again.
    pause
    exit /b 1
  )
  set "PNPM_COMMAND=corepack pnpm"
) else (
  set "PNPM_COMMAND=pnpm"
)

if not exist "%~dp0node_modules\vite\bin\vite.js" (
  echo Installing website dependencies...
  call %PNPM_COMMAND% install --frozen-lockfile
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting portfolio preview...
echo The browser will open automatically. Keep this window open while previewing.
echo If port 4178 is busy, Vite will select the next available port.
call %PNPM_COMMAND% run dev -- --host 127.0.0.1 --port 4178 --open "/zh-CN#top"
if errorlevel 1 (
  echo The preview server stopped with an error.
  pause
  exit /b 1
)
pause

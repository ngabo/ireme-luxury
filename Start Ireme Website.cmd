@echo off
title Ireme Luxury - local website server
cd /d "%~dp0"
echo Starting Ireme Luxury at http://localhost:4310 ...
start "" "http://localhost:4310/"
python -m http.server 4310

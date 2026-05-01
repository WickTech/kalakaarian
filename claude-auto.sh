#!/bin/bash

PROJECT_DIR="/home/rishi/github/kalakaarian"

cd "$PROJECT_DIR" || exit

if [ $# -eq 0 ]; then
  # No arguments → open interactive mode
  claude code
else
  # With arguments → run in print mode
  claude --print "$*"
fi

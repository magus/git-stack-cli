#!/bin/bash


SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

npx tsx "$SCRIPT_DIR"/index.ts "$@"

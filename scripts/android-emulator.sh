#!/bin/bash
# Android Emulator Helper Script
# Usage: ./scripts/android-emulator.sh [start|stop|status|run|dev]

set -e

AVD_NAME="Pixel_7_Pro_API_34"
EMULATOR_BIN="$HOME/Library/Android/sdk/emulator/emulator"
ADB_BIN="$HOME/Library/Android/sdk/platform-tools/adb"

# Set Java 21 for Capacitor/Gradle builds
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

is_emulator_running() {
    $ADB_BIN devices 2>/dev/null | grep -q "emulator"
}

wait_for_device() {
    echo -e "${YELLOW}Waiting for device to be ready...${NC}"
    $ADB_BIN wait-for-device
    # Wait for boot to complete
    while [ "$($ADB_BIN shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do
        sleep 2
    done
    echo -e "${GREEN}Device ready!${NC}"
}

case "$1" in
    start)
        if is_emulator_running; then
            echo -e "${GREEN}Emulator already running${NC}"
        else
            echo -e "${YELLOW}Starting $AVD_NAME...${NC}"
            $EMULATOR_BIN -avd $AVD_NAME -no-snapshot-load &
            wait_for_device
            echo -e "${GREEN}Emulator started!${NC}"
        fi
        ;;
    stop)
        if is_emulator_running; then
            echo -e "${YELLOW}Stopping emulator...${NC}"
            $ADB_BIN emu kill
            echo -e "${GREEN}Emulator stopped${NC}"
        else
            echo -e "${YELLOW}No emulator running${NC}"
        fi
        ;;
    status)
        if is_emulator_running; then
            echo -e "${GREEN}Emulator is running${NC}"
            $ADB_BIN devices
        else
            echo -e "${YELLOW}Emulator is not running${NC}"
        fi
        ;;
    run)
        # Start emulator if needed
        if ! is_emulator_running; then
            echo -e "${YELLOW}Starting emulator first...${NC}"
            $EMULATOR_BIN -avd $AVD_NAME -no-snapshot-load &
            wait_for_device
        fi
        # Sync and run
        echo -e "${YELLOW}Syncing Capacitor...${NC}"
        npx cap sync android
        echo -e "${YELLOW}Running app...${NC}"
        npx cap run android
        ;;
    dev)
        # Full development workflow with live reload
        if ! is_emulator_running; then
            echo -e "${YELLOW}Starting emulator...${NC}"
            $EMULATOR_BIN -avd $AVD_NAME -no-snapshot-load &
            wait_for_device
        fi
        echo -e "${YELLOW}Syncing Capacitor...${NC}"
        npx cap sync android
        echo -e "${GREEN}Starting with Live Reload...${NC}"
        echo -e "${YELLOW}Make sure 'npm run dev' is running in another terminal!${NC}"
        npx cap run android --livereload --external
        ;;
    *)
        echo "Usage: $0 {start|stop|status|run|dev}"
        echo ""
        echo "Commands:"
        echo "  start  - Start the Android emulator"
        echo "  stop   - Stop the Android emulator"
        echo "  status - Check if emulator is running"
        echo "  run    - Build and deploy app to emulator"
        echo "  dev    - Full dev workflow with live reload"
        exit 1
        ;;
esac

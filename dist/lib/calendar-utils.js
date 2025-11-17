"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Calendar Utilities
 * Helper functions for time-slot calendar calculations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBlockPosition = calculateBlockPosition;
exports.detectOverlap = detectOverlap;
exports.parseTimeString = parseTimeString;
exports.createDateTime = createDateTime;
exports.formatTimeSlot = formatTimeSlot;
exports.getBusinessHours = getBusinessHours;
exports.getCurrentTimePosition = getCurrentTimePosition;
exports.snapToQuarterHour = snapToQuarterHour;
exports.generateTimeOptions = generateTimeOptions;
const date_fns_1 = require("date-fns");
// Constants
const SLOT_HEIGHT_PX = 60; // 60px per hour
const BUSINESS_HOURS_START = 8; // 08:00
const BUSINESS_HOURS_END = 20; // 20:00
/**
 * Calculate the position and height of a booking/blocked time block
 * on the calendar grid
 */
function calculateBlockPosition(startTime, endTime) {
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const durationMinutes = (0, date_fns_1.differenceInMinutes)(endTime, startTime);
    // Top position from business hours start (08:00)
    const hoursFromStart = startHour - BUSINESS_HOURS_START;
    const topOffset = hoursFromStart * SLOT_HEIGHT_PX + (startMinute / 60) * SLOT_HEIGHT_PX;
    // Height based on duration (minimum 30px for visibility)
    const height = Math.max((durationMinutes / 60) * SLOT_HEIGHT_PX, 30);
    return {
        top: `${topOffset}px`,
        height: `${height}px`,
    };
}
/**
 * Detect if a new time block overlaps with existing blocks
 */
function detectOverlap(newStart, newEnd, existingBlocks) {
    return existingBlocks.some((block) => {
        // Overlap if new block starts before existing ends AND ends after existing starts
        return newStart < block.endTime && newEnd > block.startTime;
    });
}
/**
 * Parse time string (HH:mm format) to hour and minute
 */
function parseTimeString(timeStr) {
    const [hourStr, minuteStr] = timeStr.split(':');
    return {
        hour: parseInt(hourStr, 10),
        minute: parseInt(minuteStr, 10),
    };
}
/**
 * Create a Date object from a date string and time string
 */
function createDateTime(dateStr, timeStr) {
    const date = new Date(dateStr);
    const { hour, minute } = parseTimeString(timeStr);
    date.setHours(hour, minute, 0, 0);
    return date;
}
/**
 * Format time slot label (e.g., "08:00")
 */
function formatTimeSlot(hour) {
    return `${hour.toString().padStart(2, '0')}:00`;
}
/**
 * Generate array of business hours (8-20)
 */
function getBusinessHours() {
    const hours = [];
    for (let hour = BUSINESS_HOURS_START; hour <= BUSINESS_HOURS_END; hour++) {
        hours.push(hour);
    }
    return hours;
}
/**
 * Calculate current time indicator position (red line)
 */
function getCurrentTimePosition() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // Only show during business hours
    if (currentHour < BUSINESS_HOURS_START || currentHour >= BUSINESS_HOURS_END) {
        return { top: '0px', visible: false };
    }
    const hoursFromStart = currentHour - BUSINESS_HOURS_START;
    const topOffset = hoursFromStart * SLOT_HEIGHT_PX + (currentMinute / 60) * SLOT_HEIGHT_PX;
    return {
        top: `${topOffset}px`,
        visible: true,
    };
}
/**
 * Snap time to nearest 15-minute interval
 */
function snapToQuarterHour(date) {
    const minutes = date.getMinutes();
    const snapped = Math.round(minutes / 15) * 15;
    const result = new Date(date);
    result.setMinutes(snapped, 0, 0);
    return result;
}
/**
 * Generate time options for dropdowns (15-minute intervals)
 */
function generateTimeOptions(startHour = 8, endHour = 20) {
    const options = [];
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            if (hour === endHour && minute > 0)
                break; // Don't go past end hour
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            options.push(timeStr);
        }
    }
    return options;
}

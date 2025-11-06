"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Opening Hours Utilities
 * Generate virtual blocked times for hours outside business hours
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClosedTimeBlocks = generateClosedTimeBlocks;
const date_fns_1 = require("date-fns");
/**
 * Generate virtual blocked times for hours outside opening hours
 * For a given date and opening hours, returns array of blocked time periods
 */
function generateClosedTimeBlocks(date, openingHours, studioId) {
    if (!openingHours) {
        // No opening hours set - don't block anything
        return [];
    }
    const dayOfWeek = (0, date_fns_1.format)(date, 'EEEE').toLowerCase(); // "monday", "tuesday", etc.
    const virtualBlocks = [];
    let dayHours = null;
    // Determine hours for this specific day
    if (openingHours.everyday && typeof openingHours.everyday === 'object') {
        dayHours = openingHours.everyday;
    }
    else if (openingHours[dayOfWeek] !== undefined) {
        const hours = openingHours[dayOfWeek];
        if (typeof hours === 'object' && hours !== null && 'open' in hours && 'close' in hours) {
            dayHours = hours;
        }
    }
    // If day is closed (null or no hours), block entire day
    if (!dayHours) {
        virtualBlocks.push({
            id: `virtual-closed-all-day-${(0, date_fns_1.format)(date, 'yyyy-MM-dd')}`,
            studioId,
            startTime: (0, date_fns_1.setHours)((0, date_fns_1.setMinutes)((0, date_fns_1.startOfDay)(date), 0), 0), // 00:00
            endTime: (0, date_fns_1.setHours)((0, date_fns_1.setMinutes)((0, date_fns_1.startOfDay)(date), 59), 23), // 23:59
            reason: 'Geschlossen',
            isAllDay: true,
            isVirtual: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return virtualBlocks;
    }
    // Parse opening and closing times
    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);
    const openTime = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)((0, date_fns_1.startOfDay)(date), openHour), openMinute);
    const closeTime = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)((0, date_fns_1.startOfDay)(date), closeHour), closeMinute);
    // Block time before opening (from 00:00 to opening time)
    if (openHour > 0 || openMinute > 0) {
        virtualBlocks.push({
            id: `virtual-before-open-${(0, date_fns_1.format)(date, 'yyyy-MM-dd')}`,
            studioId,
            startTime: (0, date_fns_1.setHours)((0, date_fns_1.setMinutes)((0, date_fns_1.startOfDay)(date), 0), 0),
            endTime: openTime,
            reason: 'Geschlossen',
            isAllDay: false,
            isVirtual: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    // Block time after closing (from closing time to 23:59)
    if (closeHour < 23 || closeMinute < 59) {
        virtualBlocks.push({
            id: `virtual-after-close-${(0, date_fns_1.format)(date, 'yyyy-MM-dd')}`,
            studioId,
            startTime: closeTime,
            endTime: (0, date_fns_1.setHours)((0, date_fns_1.setMinutes)((0, date_fns_1.startOfDay)(date), 59), 23),
            reason: 'Geschlossen',
            isAllDay: false,
            isVirtual: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    return virtualBlocks;
}

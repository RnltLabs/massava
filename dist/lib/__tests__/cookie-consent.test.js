"use strict";
/**
 * Tests for cookie consent management
 *
 * @module cookie-consent.test
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tap_1 = require("tap");
const cookie_consent_1 = require("../cookie-consent");
// Mock localStorage for Node.js environment
class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = value;
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}
// Setup localStorage mock
const localStorageMock = new LocalStorageMock();
global.localStorage = localStorageMock;
global.window = { localStorage: localStorageMock };
(0, tap_1.test)("cookie-consent", async (t) => {
    // Reset localStorage before each test
    t.beforeEach(() => {
        localStorageMock.clear();
    });
    await t.test("getConsentStatus returns 'pending' when not set", (t) => {
        const status = (0, cookie_consent_1.getConsentStatus)();
        t.equal(status, "pending", "should return pending status");
        t.end();
    });
    await t.test("setConsentStatus stores 'accepted' status", (t) => {
        (0, cookie_consent_1.setConsentStatus)("accepted");
        const status = (0, cookie_consent_1.getConsentStatus)();
        t.equal(status, "accepted", "should return accepted status");
        t.end();
    });
    await t.test("setConsentStatus stores 'rejected' status", (t) => {
        (0, cookie_consent_1.setConsentStatus)("rejected");
        const status = (0, cookie_consent_1.getConsentStatus)();
        t.equal(status, "rejected", "should return rejected status");
        t.end();
    });
    await t.test("setConsentStatus stores 'pending' status", (t) => {
        (0, cookie_consent_1.setConsentStatus)("pending");
        const status = (0, cookie_consent_1.getConsentStatus)();
        t.equal(status, "pending", "should return pending status");
        t.end();
    });
    await t.test("hasConsent returns true when status is 'accepted'", (t) => {
        (0, cookie_consent_1.setConsentStatus)("accepted");
        t.ok((0, cookie_consent_1.hasConsent)(), "should return true for accepted status");
        t.end();
    });
    await t.test("hasConsent returns false when status is 'rejected'", (t) => {
        (0, cookie_consent_1.setConsentStatus)("rejected");
        t.notOk((0, cookie_consent_1.hasConsent)(), "should return false for rejected status");
        t.end();
    });
    await t.test("hasConsent returns false when status is 'pending'", (t) => {
        (0, cookie_consent_1.setConsentStatus)("pending");
        t.notOk((0, cookie_consent_1.hasConsent)(), "should return false for pending status");
        t.end();
    });
    await t.test("hasConsent returns false when no consent is set", (t) => {
        t.notOk((0, cookie_consent_1.hasConsent)(), "should return false when not set");
        t.end();
    });
    await t.test("resetConsent clears stored consent", (t) => {
        (0, cookie_consent_1.setConsentStatus)("accepted");
        t.equal((0, cookie_consent_1.getConsentStatus)(), "accepted", "should be accepted before reset");
        (0, cookie_consent_1.resetConsent)();
        t.equal((0, cookie_consent_1.getConsentStatus)(), "pending", "should be pending after reset");
        t.end();
    });
    await t.test("shouldShowConsentBanner returns true when pending", (t) => {
        t.ok((0, cookie_consent_1.shouldShowConsentBanner)(), "should show banner when pending");
        t.end();
    });
    await t.test("shouldShowConsentBanner returns false when accepted", (t) => {
        (0, cookie_consent_1.setConsentStatus)("accepted");
        t.notOk((0, cookie_consent_1.shouldShowConsentBanner)(), "should not show banner when accepted");
        t.end();
    });
    await t.test("shouldShowConsentBanner returns false when rejected", (t) => {
        (0, cookie_consent_1.setConsentStatus)("rejected");
        t.notOk((0, cookie_consent_1.shouldShowConsentBanner)(), "should not show banner when rejected");
        t.end();
    });
    await t.test("consent persists across multiple reads", (t) => {
        (0, cookie_consent_1.setConsentStatus)("accepted");
        t.equal((0, cookie_consent_1.getConsentStatus)(), "accepted", "first read should be accepted");
        t.equal((0, cookie_consent_1.getConsentStatus)(), "accepted", "second read should be accepted");
        t.equal((0, cookie_consent_1.getConsentStatus)(), "accepted", "third read should be accepted");
        t.end();
    });
    await t.test("consent can be changed from accepted to rejected", (t) => {
        (0, cookie_consent_1.setConsentStatus)("accepted");
        t.equal((0, cookie_consent_1.getConsentStatus)(), "accepted", "should start as accepted");
        (0, cookie_consent_1.setConsentStatus)("rejected");
        t.equal((0, cookie_consent_1.getConsentStatus)(), "rejected", "should change to rejected");
        t.end();
    });
    await t.test("consent can be changed from rejected to accepted", (t) => {
        (0, cookie_consent_1.setConsentStatus)("rejected");
        t.equal((0, cookie_consent_1.getConsentStatus)(), "rejected", "should start as rejected");
        (0, cookie_consent_1.setConsentStatus)("accepted");
        t.equal((0, cookie_consent_1.getConsentStatus)(), "accepted", "should change to accepted");
        t.end();
    });
    await t.test("handles localStorage with invalid values", (t) => {
        // Manually set invalid value in localStorage
        localStorage.setItem("massava_cookie_consent", "invalid_value");
        const status = (0, cookie_consent_1.getConsentStatus)();
        t.equal(status, "pending", "should return pending for invalid values");
        t.end();
    });
});

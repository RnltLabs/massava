/**
 * Tests for cookie consent management
 *
 * @module cookie-consent.test
 */

import { test } from "tap"
import {
  getConsentStatus,
  setConsentStatus,
  hasConsent,
  resetConsent,
  shouldShowConsentBanner,
  type ConsentStatus,
} from "../cookie-consent"

// Mock localStorage for Node.js environment
class LocalStorageMock {
  private store: Record<string, string> = {}

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string): void {
    this.store[key] = value
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }
}

// Setup localStorage mock
const localStorageMock = new LocalStorageMock()
global.localStorage = localStorageMock as Storage
;(global as any).window = { localStorage: localStorageMock }

test("cookie-consent", async (t) => {
  // Reset localStorage before each test
  t.beforeEach(() => {
    localStorageMock.clear()
  })

  await t.test("getConsentStatus returns 'pending' when not set", (t) => {
    const status = getConsentStatus()
    t.equal(status, "pending", "should return pending status")
    t.end()
  })

  await t.test("setConsentStatus stores 'accepted' status", (t) => {
    setConsentStatus("accepted")
    const status = getConsentStatus()
    t.equal(status, "accepted", "should return accepted status")
    t.end()
  })

  await t.test("setConsentStatus stores 'rejected' status", (t) => {
    setConsentStatus("rejected")
    const status = getConsentStatus()
    t.equal(status, "rejected", "should return rejected status")
    t.end()
  })

  await t.test("setConsentStatus stores 'pending' status", (t) => {
    setConsentStatus("pending")
    const status = getConsentStatus()
    t.equal(status, "pending", "should return pending status")
    t.end()
  })

  await t.test("hasConsent returns true when status is 'accepted'", (t) => {
    setConsentStatus("accepted")
    t.ok(hasConsent(), "should return true for accepted status")
    t.end()
  })

  await t.test("hasConsent returns false when status is 'rejected'", (t) => {
    setConsentStatus("rejected")
    t.notOk(hasConsent(), "should return false for rejected status")
    t.end()
  })

  await t.test("hasConsent returns false when status is 'pending'", (t) => {
    setConsentStatus("pending")
    t.notOk(hasConsent(), "should return false for pending status")
    t.end()
  })

  await t.test("hasConsent returns false when no consent is set", (t) => {
    t.notOk(hasConsent(), "should return false when not set")
    t.end()
  })

  await t.test("resetConsent clears stored consent", (t) => {
    setConsentStatus("accepted")
    t.equal(getConsentStatus(), "accepted", "should be accepted before reset")

    resetConsent()
    t.equal(getConsentStatus(), "pending", "should be pending after reset")
    t.end()
  })

  await t.test("shouldShowConsentBanner returns true when pending", (t) => {
    t.ok(shouldShowConsentBanner(), "should show banner when pending")
    t.end()
  })

  await t.test("shouldShowConsentBanner returns false when accepted", (t) => {
    setConsentStatus("accepted")
    t.notOk(shouldShowConsentBanner(), "should not show banner when accepted")
    t.end()
  })

  await t.test("shouldShowConsentBanner returns false when rejected", (t) => {
    setConsentStatus("rejected")
    t.notOk(shouldShowConsentBanner(), "should not show banner when rejected")
    t.end()
  })

  await t.test("consent persists across multiple reads", (t) => {
    setConsentStatus("accepted")

    t.equal(getConsentStatus(), "accepted", "first read should be accepted")
    t.equal(getConsentStatus(), "accepted", "second read should be accepted")
    t.equal(getConsentStatus(), "accepted", "third read should be accepted")
    t.end()
  })

  await t.test("consent can be changed from accepted to rejected", (t) => {
    setConsentStatus("accepted")
    t.equal(getConsentStatus(), "accepted", "should start as accepted")

    setConsentStatus("rejected")
    t.equal(getConsentStatus(), "rejected", "should change to rejected")
    t.end()
  })

  await t.test("consent can be changed from rejected to accepted", (t) => {
    setConsentStatus("rejected")
    t.equal(getConsentStatus(), "rejected", "should start as rejected")

    setConsentStatus("accepted")
    t.equal(getConsentStatus(), "accepted", "should change to accepted")
    t.end()
  })

  await t.test("handles localStorage with invalid values", (t) => {
    // Manually set invalid value in localStorage
    localStorage.setItem("massava_cookie_consent", "invalid_value")

    const status = getConsentStatus()
    t.equal(status, "pending", "should return pending for invalid values")
    t.end()
  })
})

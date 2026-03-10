import test from "node:test";
import assert from "node:assert/strict";
import {
  GENERIC_PASSWORD_RESET_MESSAGE,
  PASSWORD_REQUIREMENTS_MESSAGE,
  isStrongPassword,
  isValidEmail,
  normalizeEmail,
} from "../src/core/utils/auth.js";

test("normalizeEmail trims and lowercases email addresses", () => {
  assert.equal(normalizeEmail("  Owner@Example.COM "), "owner@example.com");
  assert.equal(normalizeEmail(""), "");
});

test("isValidEmail validates normalized email addresses", () => {
  assert.equal(isValidEmail(" sales@shop.com "), true);
  assert.equal(isValidEmail("not-an-email"), false);
});

test("isStrongPassword enforces sell-ready password rules", () => {
  assert.equal(isStrongPassword("Weakpass"), false);
  assert.equal(isStrongPassword("weakpass1"), false);
  assert.equal(isStrongPassword("WEAKPASS1"), false);
  assert.equal(isStrongPassword("StrongPass1"), true);
});

test("auth copy exposes stable generic reset and password guidance", () => {
  assert.match(GENERIC_PASSWORD_RESET_MESSAGE, /If the email is registered/i);
  assert.match(PASSWORD_REQUIREMENTS_MESSAGE, /8 characters/i);
});

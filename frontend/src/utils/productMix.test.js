import test from 'node:test';
import assert from 'node:assert/strict';
import { formatProductMixLabel } from './productMix.js';

test('formats brand and weight together', () => {
  assert.equal(formatProductMixLabel({ brand: 'Regasco', weightClass: 11 }), 'Regasco - 11kg');
});

test('falls back to weight when brand is missing', () => {
  assert.equal(formatProductMixLabel({ weightClass: 5 }), '5kg');
});

test('falls back to brand when weight is missing', () => {
  assert.equal(formatProductMixLabel({ brand: 'AquaGas' }), 'AquaGas');
});

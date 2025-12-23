/**
 * Property-Based Tests for CanvasStyleSerializer
 *
 * **Featurchatus-bug-fixes, Property 3: Canvas Style Round-Trip**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  serializeStyle,
  deserializeStyle,
  applyStyleToContext,
  createStyleMetadata,
  areStylesEquivalent,
  isValidBrushType,
  isValidColor,
  isValidStrokeWidth,
  isValidStyleMetadata,
  DEFAULT_STYLE,
  CanvasStyleMetadata,
} from '@/lib/canvas-style';
import { BrushType } from '@/lib/types';

// Valid brush types
const VALID_BRUSH_TYPES: BrushType[] = ['normal', 'neon', 'dashed', 'calligraphy'];

// Arbitraries for generating test data
const brushTypeArb = fc.constantFrom<BrushType>(...VALID_BRUSH_TYPES);

// Generate valid hex colors (6 hex digits)
const hexDigitArb = fc.constantFrom(...'0123456789ABCDEF'.split(''));
const hexColorArb = fc.array(hexDigitArb, { minLength: 6, maxLength: 6 })
  .map((digits) => `#${digits.join('')}`);

// Generate valid stroke widths (1-100)
const strokeWidthArb = fc.integer({ min: 1, max: 100 });

// Generate valid timestamps
const timestampArb = fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER });

// Generate valid CanvasStyleMetadata
const validStyleMetadataArb = fc.record({
  brushType: brushTypeArb,
  strokeWidth: strokeWidthArb,
  color: hexColorArb,
  timestamp: timestampArb,
});

describe('CanvasStyleSerializer', () => {
  describe('Property 3: Canvas Style Round-Trip', () => {
    /**
     * Property: For any valid brush style selection, serializing the style to chat
     * and deserializing it back SHALL produce an equivalent style configuration.
     *
     * **Feature: chatus-bug-fixes, Property 3: Canvas Style Round-Trip**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    it('should round-trip any valid style metadata', () => {
      fc.assert(
        fc.property(validStyleMetadataArb, (originalStyle) => {
          // Serialize the style
          const serialized = serializeStyle(originalStyle);
          expect(serialized.success).toBe(true);
          expect(serialized.data).toBeTruthy();

          // Deserialize back
          const deserialized = deserializeStyle(serialized.data);
          expect(deserialized.success).toBe(true);
          expect(deserialized.style).not.toBeNull();

          // Verify all properties match
          const roundTripped = deserialized.style!;
          expect(roundTripped.brushType).toBe(originalStyle.brushType);
          expect(roundTripped.strokeWidth).toBe(originalStyle.strokeWidth);
          expect(roundTripped.color).toBe(originalStyle.color);
          expect(roundTripped.timestamp).toBe(originalStyle.timestamp);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Serialization should preserve brush type for all valid brush types.
     *
     * **Feature: chatus-bug-fixes, Property 3: Canvas Style Round-Trip**
     * **Validates: Requirements 4.1, 4.2**
     */
    it('should preserve brush type through serialization for all brush types', () => {
      fc.assert(
        fc.property(
          brushTypeArb,
          strokeWidthArb,
          hexColorArb,
          timestampArb,
          (brushType, strokeWidth, color, timestamp) => {
            const style: CanvasStyleMetadata = {
              brushType,
              strokeWidth,
              color,
              timestamp,
            };

            const serialized = serializeStyle(style);
            expect(serialized.success).toBe(true);

            const deserialized = deserializeStyle(serialized.data);
            expect(deserialized.success).toBe(true);
            expect(deserialized.style?.brushType).toBe(brushType);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: areStylesEquivalent should return true for round-tripped styles.
     *
     * **Feature: chatus-bug-fixes, Property 3: Canvas Style Round-Trip**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    it('should consider round-tripped styles equivalent', () => {
      fc.assert(
        fc.property(validStyleMetadataArb, (originalStyle) => {
          const serialized = serializeStyle(originalStyle);
          const deserialized = deserializeStyle(serialized.data);

          expect(deserialized.success).toBe(true);
          expect(areStylesEquivalent(originalStyle, deserialized.style!)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: createStyleMetadata should produce valid metadata that round-trips.
     *
     * **Feature: chatus-bug-fixes, Property 3: Canvas Style Round-Trip**
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    it('should create valid metadata that round-trips correctly', () => {
      fc.assert(
        fc.property(brushTypeArb, strokeWidthArb, hexColorArb, (brushType, strokeWidth, color) => {
          const created = createStyleMetadata(brushType, strokeWidth, color);

          expect(isValidStyleMetadata(created)).toBe(true);

          const serialized = serializeStyle(created);
          expect(serialized.success).toBe(true);

          const deserialized = deserializeStyle(serialized.data);
          expect(deserialized.success).toBe(true);
          expect(deserialized.style?.brushType).toBe(brushType);
          expect(deserialized.style?.strokeWidth).toBe(strokeWidth);
          expect(deserialized.style?.color).toBe(color);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Functions', () => {
    /**
     * Property: isValidBrushType should return true only for valid brush types.
     */
    it('should validate brush types correctly', () => {
      fc.assert(
        fc.property(brushTypeArb, (brushType) => {
          expect(isValidBrushType(brushType)).toBe(true);
        }),
        { numRuns: 100 }
      );

      // Invalid brush types
      expect(isValidBrushType('invalid')).toBe(false);
      expect(isValidBrushType('')).toBe(false);
      expect(isValidBrushType(null)).toBe(false);
      expect(isValidBrushType(undefined)).toBe(false);
      expect(isValidBrushType(123)).toBe(false);
    });

    /**
     * Property: isValidColor should return true only for valid hex colors.
     */
    it('should validate hex colors correctly', () => {
      fc.assert(
        fc.property(hexColorArb, (color) => {
          expect(isValidColor(color)).toBe(true);
        }),
        { numRuns: 100 }
      );

      // Valid colors
      expect(isValidColor('#FFF')).toBe(true);
      expect(isValidColor('#FFFFFF')).toBe(true);
      expect(isValidColor('#FFFFFFFF')).toBe(true);

      // Invalid colors
      expect(isValidColor('red')).toBe(false);
      expect(isValidColor('rgb(255,0,0)')).toBe(false);
      expect(isValidColor('#GGG')).toBe(false);
      expect(isValidColor('')).toBe(false);
      expect(isValidColor(null)).toBe(false);
    });

    /**
     * Property: isValidStrokeWidth should return true only for valid stroke widths.
     */
    it('should validate stroke widths correctly', () => {
      fc.assert(
        fc.property(strokeWidthArb, (strokeWidth) => {
          expect(isValidStrokeWidth(strokeWidth)).toBe(true);
        }),
        { numRuns: 100 }
      );

      // Invalid stroke widths
      expect(isValidStrokeWidth(0)).toBe(false);
      expect(isValidStrokeWidth(-1)).toBe(false);
      expect(isValidStrokeWidth(101)).toBe(false);
      expect(isValidStrokeWidth(Infinity)).toBe(false);
      expect(isValidStrokeWidth(NaN)).toBe(false);
      expect(isValidStrokeWidth('5')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid serialization inputs gracefully', () => {
      // @ts-expect-error Testing null input
      const nullResult = serializeStyle(null);
      expect(nullResult.success).toBe(false);
      expect(nullResult.error).toBeTruthy();

      // @ts-expect-error Testing undefined input
      const undefinedResult = serializeStyle(undefined);
      expect(undefinedResult.success).toBe(false);

      // Invalid brush type
      const invalidBrush = serializeStyle({
        brushType: 'invalid' as BrushType,
        strokeWidth: 5,
        color: '#FFFFFF',
        timestamp: Date.now(),
      });
      expect(invalidBrush.success).toBe(false);

      // Invalid stroke width
      const invalidStroke = serializeStyle({
        brushType: 'normal',
        strokeWidth: -1,
        color: '#FFFFFF',
        timestamp: Date.now(),
      });
      expect(invalidStroke.success).toBe(false);

      // Invalid color
      const invalidColor = serializeStyle({
        brushType: 'normal',
        strokeWidth: 5,
        color: 'red',
        timestamp: Date.now(),
      });
      expect(invalidColor.success).toBe(false);
    });

    it('should handle invalid deserialization inputs gracefully', () => {
      // Empty string
      const emptyResult = deserializeStyle('');
      expect(emptyResult.success).toBe(false);

      // Invalid JSON
      const invalidJson = deserializeStyle('not json');
      expect(invalidJson.success).toBe(false);

      // Missing properties
      const missingProps = deserializeStyle('{"brushType": "normal"}');
      expect(missingProps.success).toBe(false);

      // Invalid brush type in JSON
      const invalidBrushJson = deserializeStyle(
        '{"brushType": "invalid", "strokeWidth": 5, "color": "#FFFFFF", "timestamp": 123}'
      );
      expect(invalidBrushJson.success).toBe(false);

      // @ts-expect-error Testing null input
      const nullResult = deserializeStyle(null);
      expect(nullResult.success).toBe(false);
    });
  });

  describe('applyStyleToContext', () => {
    it('should throw for invalid context', () => {
      const style = createStyleMetadata('normal', 5, '#FFFFFF');

      // @ts-expect-error Testing null context
      expect(() => applyStyleToContext(null, style)).toThrow('Canvas context is required');
    });

    // Note: Tests requiring real canvas context are skipped in jsdom environment
    // These would need to run in a browser environment or with canvas npm package
    it.skip('should throw for invalid style (requires canvas)', () => {
      // This test requires a real canvas context
    });

    it.skip('should apply styles correctly for each brush type (requires canvas)', () => {
      // This test requires a real canvas context
    });
  });

  describe('DEFAULT_STYLE', () => {
    it('should be a valid style metadata', () => {
      expect(isValidStyleMetadata(DEFAULT_STYLE)).toBe(true);
    });

    it('should serialize and deserialize correctly', () => {
      const serialized = serializeStyle(DEFAULT_STYLE);
      expect(serialized.success).toBe(true);

      const deserialized = deserializeStyle(serialized.data);
      expect(deserialized.success).toBe(true);
      expect(areStylesEquivalent(DEFAULT_STYLE, deserialized.style!)).toBe(true);
    });
  });
});

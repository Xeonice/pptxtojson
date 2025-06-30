import { ColorUtils } from '@/lib/services/utils/ColorUtils';
import { TextElement } from '@/lib/models/domain/elements/TextElement';
import { Theme } from '@/lib/models/domain/Theme';

describe('Edge Cases Tests', () => {
  describe('Color Value Edge Cases', () => {
    test('should handle transparent colors correctly', () => {
      // Test different transparent color representations
      const transparentCases = [
        'transparent',
        'rgba(0,0,0,0)',
        'rgba(255,255,255,0)',
        '#00000000'
      ];
      
      transparentCases.forEach(transparentColor => {
        const result = ColorUtils.toRgba(transparentColor);
        expect(result).toContain(',0)'); // Should have alpha = 0
      });
    });
    
    test('should handle none and null color values', () => {
      const noneCase = 'none';
      const result = ColorUtils.toRgba(noneCase);
      // 'none' should return transparent
      expect(result).toBe('rgba(0,0,0,0)');

      const nullCases = [
        null,
        undefined,
        '',
        '   ', // whitespace
      ];
      
      nullCases.forEach(nullColor => {
        const result = ColorUtils.toRgba(nullColor as any);
        // Should fallback to default black
        expect(result).toBe('rgba(0,0,0,1)');
      });
    });
    
    test('should handle invalid color formats gracefully', () => {
      const invalidColors = [
        'not-a-color',
        '#zzz',
        'rgb(256,256,256)', // Out of range
        'rgba(100,100)', // Incomplete
        'hsl(120,50%,50%)', // Unsupported format
        '#1234567890', // Too long
        'rgb(-50,-50,-50)', // Negative values
        'rgba(100,100,100,2.5)', // Alpha > 1
      ];
      
      invalidColors.forEach(invalidColor => {
        const result = ColorUtils.toRgba(invalidColor);
        // Should not crash and return fallback
        expect(result).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      });
    });
    
    test('should handle extreme hex values', () => {
      const extremeHexCases = [
        '#000000', // Pure black
        '#ffffff', // Pure white
        '#ff0000', // Pure red
        '#00ff00', // Pure green
        '#0000ff', // Pure blue
        '#123', // 3-digit
        '#abcdef', // All letters
        '#123456', // Mixed numbers and letters
      ];
      
      extremeHexCases.forEach(hexColor => {
        const result = ColorUtils.toRgba(hexColor);
        expect(result).toMatch(/^rgba\(\d+,\d+,\d+,1\)$/);
      });
    });
    
    test('should handle malformed rgba strings', () => {
      const malformedRgba = [
        'rgba(100,100,100)', // Missing alpha
        'rgba(100,100,100,0.5,extra)', // Extra parameter
        'rgba(100.5,100.5,100.5,0.5)', // Decimal color values
        'rgba( 100 , 100 , 100 , 0.5 )', // Extra spaces
        'RGBA(100,100,100,0.5)', // Uppercase
        'rgb(100,100,100,0.5)', // RGB with alpha
      ];
      
      malformedRgba.forEach(malformed => {
        const result = ColorUtils.toRgba(malformed);
        // Should either parse correctly or fallback gracefully
        expect(result).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
      });
    });
  });

  describe('TextElement Edge Cases', () => {
    test('should handle empty text content', () => {
      const textElement = new TextElement('empty-text-test');
      textElement.addContent({
        text: '',
        style: {
          color: '#ff0000',
          fontSize: 16
        }
      });
      
      const json = textElement.toJSON();
      
      // Should still generate proper structure
      expect(json.content).toContain('<div  style="">');
      expect(json.content).toContain('<p  style="">');
      expect(json.content).toContain('color:#ff0000');
    });
    
    test('should handle null and undefined text', () => {
      const textElement = new TextElement('null-text-test');
      
      // Try adding content with null/undefined text
      textElement.addContent({
        text: null as any,
        style: { fontSize: 12 }
      });
      
      textElement.addContent({
        text: undefined as any,
        style: { fontSize: 14 }
      });
      
      const json = textElement.toJSON();
      
      // Should handle gracefully
      expect(json.content).toBeTruthy();
      expect(json.type).toBe('text');
    });
    
    test('should handle extremely long text content', () => {
      const longText = 'A'.repeat(10000); // 10k characters
      
      const textElement = new TextElement('long-text-test');
      textElement.addContent({
        text: longText,
        style: {
          color: '#333333',
          fontSize: 12
        }
      });
      
      const json = textElement.toJSON();
      
      expect(json.content).toContain(longText);
      expect(json.content).toContain('color:#333333');
    });
    
    test('should handle special Unicode characters', () => {
      const unicodeText = '🎨💻🌟 Unicode ñáéíóú 中文 العربية русский 日本語';
      
      const textElement = new TextElement('unicode-test');
      textElement.addContent({
        text: unicodeText,
        style: {
          color: '#5b9bd5',
          fontSize: 16
        }
      });
      
      const json = textElement.toJSON();
      
      expect(json.content).toContain(unicodeText);
      expect(json.content).toContain('color:#5b9bd5');
    });
    
    test('should handle content with no style object', () => {
      const textElement = new TextElement('no-style-test');
      textElement.addContent({
        text: 'No Style Content'
        // No style property
      } as any);
      
      const json = textElement.toJSON();
      
      expect(json.content).toContain('No Style Content');
      expect(json.defaultColor).toEqual({ color: '#333333', colorType: 'dk1' });
    });
    
    test('should handle mixed valid and invalid content', () => {
      const textElement = new TextElement('mixed-content-test');
      
      // Add valid content
      textElement.addContent({
        text: 'Valid content',
        style: { color: '#ff0000', fontSize: 16 }
      });
      
      // Add invalid content
      textElement.addContent({
        text: null as any,
        style: { color: 'invalid-color', fontSize: -10 }
      });
      
      // Add another valid content
      textElement.addContent({
        text: 'Another valid',
        style: { color: '#00ff00' }
      });
      
      const json = textElement.toJSON();
      
      // Should handle valid content properly
      expect(json.content).toContain('Valid content');
      expect(json.content).toContain('Another valid');
      expect(json.content).toContain('color:#ff0000');
      expect(json.content).toContain('color:#00ff00');
    });
  });

  describe('Theme Processing Edge Cases', () => {
    test('should handle missing theme colors', () => {
      const theme = new Theme();
      
      // Don't set any theme colors
      const nonexistentColor = theme.getThemeColor('nonexistent');
      expect(nonexistentColor).toBeUndefined();
      
      // Should handle undefined gracefully in ColorUtils
      const processedColor = ColorUtils.toRgba(nonexistentColor);
      expect(processedColor).toBe('rgba(0,0,0,1)');
    });
    
    test('should handle corrupted theme data', () => {
      const theme = new Theme();
      
      // Set invalid theme colors
      theme.setThemeColor('accent1', 'invalid-color');
      theme.setThemeColor('dk1', null as any);
      theme.setThemeColor('lt1', undefined as any);
      
      const accent1 = theme.getThemeColor('accent1');
      const dk1 = theme.getThemeColor('dk1');
      const lt1 = theme.getThemeColor('lt1');
      
      // Should handle invalid colors gracefully
      expect(ColorUtils.toRgba(accent1)).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba(dk1)).toBe('rgba(0,0,0,1)');
      expect(ColorUtils.toRgba(lt1)).toBe('rgba(0,0,0,1)');
    });
    
    test('should handle circular theme references', () => {
      // This would be a problem if themes could reference each other
      const theme = new Theme();
      theme.setThemeColor('accent1', 'rgba(91,155,213,1)');
      theme.setThemeColor('accent2', 'rgba(91,155,213,1)'); // Same as accent1
      
      // Should not cause infinite loops
      expect(theme.getThemeColor('accent1')).toBe('rgba(91,155,213,1)');
      expect(theme.getThemeColor('accent2')).toBe('rgba(91,155,213,1)');
    });
    
    test('should handle empty theme', () => {
      const theme = new Theme();
      
      // No colors or fonts set
      expect(theme.getThemeColor('accent1')).toBeUndefined();
      expect(theme.getFontName()).toBe(''); // Default empty string
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle memory stress with many elements', () => {
      const elements: TextElement[] = [];
      
      // Create many elements
      for (let i = 0; i < 1000; i++) {
        const element = new TextElement(`stress-test-${i}`);
        element.addContent({
          text: `Stress test element ${i}`,
          style: {
            color: `#${i.toString(16).padStart(6, '0').substring(0, 6)}`,
            fontSize: 12 + (i % 20)
          }
        });
        elements.push(element);
      }
      
      // Convert all to JSON
      const startTime = Date.now();
      const jsons = elements.map(el => el.toJSON());
      const endTime = Date.now();
      
      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds
      expect(jsons.length).toBe(1000);
      
      // Verify first and last elements
      expect(jsons[0].content).toContain('Stress test element 0');
      expect(jsons[999].content).toContain('Stress test element 999');
    });
    
    test('should handle rapid successive color modifications', () => {
      let color = 'rgba(128,128,128,1)';
      
      const startTime = Date.now();
      
      // Apply many modifications rapidly
      for (let i = 0; i < 10000; i++) {
        color = ColorUtils.applyLuminanceMod(color, 0.99 + (i % 10) * 0.001);
        if (i % 100 === 0) {
          color = ColorUtils.toRgba(color); // Normalize periodically
        }
      }
      
      const endTime = Date.now();
      
      // Should complete quickly
      expect(endTime - startTime).toBeLessThan(1000); // 1000ms (increased for CI environments)
      expect(color).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
    });
    
    test('should handle concurrent element creation', () => {
      // Simulate concurrent element creation (though JS is single-threaded)
      const promises = Array.from({ length: 100 }, (_, i) => {
        return new Promise<any>(resolve => {
          setTimeout(() => {
            const element = new TextElement(`concurrent-${i}`);
            element.addContent({
              text: `Concurrent ${i}`,
              style: { color: '#ff0000', fontSize: 14 }
            });
            resolve(element.toJSON());
          }, Math.random() * 10);
        });
      });
      
      return Promise.all(promises).then(results => {
        expect(results.length).toBe(100);
        results.forEach((json, i) => {
          expect(json.content).toContain(`Concurrent ${i}`);
          expect(json.content).toContain('color:#ff0000');
        });
      });
    });
  });

  describe('Data Integrity Edge Cases', () => {
    test('should maintain data integrity with extreme values', () => {
      const textElement = new TextElement('extreme-values-test');
      
      textElement.setPosition({ x: Number.MAX_SAFE_INTEGER, y: Number.MIN_SAFE_INTEGER });
      textElement.setSize({ width: Number.MAX_VALUE, height: Number.MIN_VALUE });
      textElement.setRotation(360000); // Many full rotations
      
      textElement.addContent({
        text: 'Extreme Values',
        style: {
          fontSize: 999999,
          color: '#ffffff'
        }
      });
      
      const json = textElement.toJSON();
      
      // Should handle extreme values without crashing
      expect(json.type).toBe('text');
      expect(json.content).toContain('Extreme Values');
      expect(typeof json.left).toBe('number');
      expect(typeof json.top).toBe('number');
      expect(typeof json.width).toBe('number');
      expect(typeof json.height).toBe('number');
    });
    
    test('should handle JSON serialization edge cases', () => {
      const textElement = new TextElement('json-edge-test');
      
      // Add content with characters that might break JSON
      textElement.addContent({
        text: 'JSON "quotes" and \\backslashes\\ and \nnewlines\n and \ttabs\t',
        style: {
          color: '#ff0000',
          fontSize: 16
        }
      });
      
      const json = textElement.toJSON();
      
      // Should serialize without breaking
      expect(() => JSON.stringify(json)).not.toThrow();
      
      const serialized = JSON.stringify(json);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized.type).toBe('text');
      expect(deserialized.content).toContain('quotes');
      expect(deserialized.content).toContain('backslashes');
    });
    
    test('should handle object mutation after creation', () => {
      const textElement = new TextElement('mutation-test');
      textElement.addContent({
        text: 'Original Text',
        style: { color: '#ff0000' }
      });
      
      const json1 = textElement.toJSON();
      
      // Modify the element
      textElement.addContent({
        text: ' Additional Text',
        style: { color: '#00ff00' }
      });
      
      const json2 = textElement.toJSON();
      
      // Should reflect changes
      expect(json1.content).toContain('Original Text');
      expect(json1.content).not.toContain('Additional Text');
      
      expect(json2.content).toContain('Original Text');
      expect(json2.content).toContain('Additional Text');
      expect(json2.content).toContain('color:#ff0000');
      expect(json2.content).toContain('color:#00ff00');
    });
  });

  describe('Integration Edge Cases', () => {
    test('should handle mixed element types in processing context', () => {
      // This test simulates processing multiple element types
      // which might share color utilities and themes
      
      const theme = new Theme();
      theme.setThemeColor('accent1', 'rgba(91,155,213,1)');
      
      const textElement = new TextElement('mixed-integration-test');
      textElement.addContent({
        text: 'Mixed Integration',
        style: {
          color: theme.getThemeColor('accent1'),
          fontSize: 20
        }
      });
      
      const json = textElement.toJSON();
      
      expect(json.content).toContain('color:rgba(91,155,213,1)');
      expect(json.content).toContain('Mixed Integration');
    });
    
    test('should handle partial processing failures gracefully', () => {
      const textElement = new TextElement('partial-failure-test');
      
      // Add mix of valid and problematic content
      textElement.addContent({
        text: 'Good content',
        style: { color: '#00ff00', fontSize: 16 }
      });
      
      // This might cause issues but shouldn't break everything
      textElement.addContent({
        text: 'Problematic content',
        style: { 
          color: null as any,
          fontSize: 'not-a-number' as any,
          bold: 'maybe' as any
        }
      });
      
      textElement.addContent({
        text: 'Another good content',
        style: { color: '#0000ff', fontSize: 18 }
      });
      
      const json = textElement.toJSON();
      
      // Should still work for valid content
      expect(json.content).toContain('Good content');
      expect(json.content).toContain('Another good content');
      expect(json.content).toContain('color:#00ff00');
      expect(json.content).toContain('color:#0000ff');
    });
  });
});
import { describe, it, expect } from 'vitest';
import { applyLayout, calculateBoundingBox, isPointInLayer } from '@/compositor/layoutEngine';
import { LayerSpec } from '@/compositor/TemplateSpec';

describe('Layout Engine', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;

  describe('applyLayout', () => {
    it('should handle pixel-based positioning', () => {
      const layer: LayerSpec = {
        id: 'test-layer',
        type: 'shape',
        name: 'Test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 0,
        transform: {
          x: 100,
          y: 50,
          width: 200,
          height: 150,
        },
        shape: {
          type: 'rectangle',
          fill: '#ff0000',
        },
      };

      const result = applyLayout(layer, canvasWidth, canvasHeight);

      expect(result).toEqual({
        x: 100,
        y: 50,
        width: 200,
        height: 150,
      });
    });

    it('should handle percentage-based positioning', () => {
      const layer: LayerSpec = {
        id: 'test-layer',
        type: 'shape',
        name: 'Test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 0,
        transform: {
          x: '10%',
          y: '20%',
          width: '50%',
          height: '30%',
        },
        shape: {
          type: 'rectangle',
          fill: '#ff0000',
        },
      };

      const result = applyLayout(layer, canvasWidth, canvasHeight);

      expect(result).toEqual({
        x: 80, // 10% of 800
        y: 120, // 20% of 600
        width: 400, // 50% of 800
        height: 180, // 30% of 600
      });
    });

    it('should handle mixed units', () => {
      const layer: LayerSpec = {
        id: 'test-layer',
        type: 'shape',
        name: 'Test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 0,
        transform: {
          x: '25%',
          y: 100,
          width: 300,
          height: '40%',
        },
        shape: {
          type: 'rectangle',
          fill: '#ff0000',
        },
      };

      const result = applyLayout(layer, canvasWidth, canvasHeight);

      expect(result).toEqual({
        x: 200, // 25% of 800
        y: 100,
        width: 300,
        height: 240, // 40% of 600
      });
    });

    it('should apply anchor points correctly', () => {
      const layer: LayerSpec = {
        id: 'test-layer',
        type: 'shape',
        name: 'Test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 0,
        transform: {
          x: '50%',
          y: '50%',
          width: 200,
          height: 100,
          anchor: 'center',
        },
        shape: {
          type: 'rectangle',
          fill: '#ff0000',
        },
      };

      const result = applyLayout(layer, canvasWidth, canvasHeight);

      expect(result).toEqual({
        x: 300, // 50% of 800 (400) - 100 (half width)
        y: 250, // 50% of 600 (300) - 50 (half height)
        width: 200,
        height: 100,
      });
    });

    it('should handle different anchor points', () => {
      const baseTransform = {
        x: 400,
        y: 300,
        width: 100,
        height: 60,
      };

      const anchors = [
        { anchor: 'top-left', expectedX: 400, expectedY: 300 },
        { anchor: 'top-center', expectedX: 350, expectedY: 300 },
        { anchor: 'top-right', expectedX: 300, expectedY: 300 },
        { anchor: 'center-left', expectedX: 400, expectedY: 270 },
        { anchor: 'center', expectedX: 350, expectedY: 270 },
        { anchor: 'center-right', expectedX: 300, expectedY: 270 },
        { anchor: 'bottom-left', expectedX: 400, expectedY: 240 },
        { anchor: 'bottom-center', expectedX: 350, expectedY: 240 },
        { anchor: 'bottom-right', expectedX: 300, expectedY: 240 },
      ];

      anchors.forEach(({ anchor, expectedX, expectedY }) => {
        const layer: LayerSpec = {
          id: 'test-layer',
          type: 'shape',
          name: 'Test',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          zIndex: 0,
          transform: {
            ...baseTransform,
            anchor: anchor as any,
          },
          shape: {
            type: 'rectangle',
            fill: '#ff0000',
          },
        };

        const result = applyLayout(layer, canvasWidth, canvasHeight);
        expect(result.x).toBe(expectedX);
        expect(result.y).toBe(expectedY);
      });
    });

    it('should handle scaling', () => {
      const layer: LayerSpec = {
        id: 'test-layer',
        type: 'shape',
        name: 'Test',
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        zIndex: 0,
        transform: {
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          scale: 1.5,
        },
        shape: {
          type: 'rectangle',
          fill: '#ff0000',
        },
      };

      const result = applyLayout(layer, canvasWidth, canvasHeight);

      expect(result).toEqual({
        x: 100,
        y: 100,
        width: 300, // 200 * 1.5
        height: 225, // 150 * 1.5
      });
    });
  });

  describe('calculateBoundingBox', () => {
    it('should calculate bounding box for multiple layers', () => {
      const layers: LayerSpec[] = [
        {
          id: 'layer1',
          type: 'shape',
          name: 'Layer 1',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          zIndex: 0,
          transform: { x: 10, y: 10, width: 100, height: 50 },
          shape: { type: 'rectangle', fill: '#ff0000' },
        },
        {
          id: 'layer2',
          type: 'shape',
          name: 'Layer 2',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          zIndex: 1,
          transform: { x: 80, y: 40, width: 120, height: 80 },
          shape: { type: 'rectangle', fill: '#00ff00' },
        },
      ];

      const result = calculateBoundingBox(layers, canvasWidth, canvasHeight);

      expect(result).toEqual({
        x: 10,
        y: 10,
        width: 190, // from x=10 to x=200 (80+120)
        height: 110, // from y=10 to y=120 (40+80)
      });
    });

    it('should ignore invisible layers', () => {
      const layers: LayerSpec[] = [
        {
          id: 'visible-layer',
          type: 'shape',
          name: 'Visible',
          visible: true,
          opacity: 1,
          blendMode: 'normal',
          zIndex: 0,
          transform: { x: 50, y: 50, width: 100, height: 100 },
          shape: { type: 'rectangle', fill: '#ff0000' },
        },
        {
          id: 'invisible-layer',
          type: 'shape',
          name: 'Invisible',
          visible: false,
          opacity: 1,
          blendMode: 'normal',
          zIndex: 1,
          transform: { x: 0, y: 0, width: 1000, height: 1000 },
          shape: { type: 'rectangle', fill: '#00ff00' },
        },
      ];

      const result = calculateBoundingBox(layers, canvasWidth, canvasHeight);

      expect(result).toEqual({
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      });
    });

    it('should return null for empty layer list', () => {
      const result = calculateBoundingBox([], canvasWidth, canvasHeight);
      expect(result).toBeNull();
    });
  });

  describe('isPointInLayer', () => {
    const layer: LayerSpec = {
      id: 'test-layer',
      type: 'shape',
      name: 'Test',
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      zIndex: 0,
      transform: { x: 100, y: 100, width: 200, height: 150 },
      shape: { type: 'rectangle', fill: '#ff0000' },
    };

    it('should detect point inside layer', () => {
      const result = isPointInLayer(150, 150, layer, canvasWidth, canvasHeight);
      expect(result).toBe(true);
    });

    it('should detect point outside layer', () => {
      const result = isPointInLayer(50, 50, layer, canvasWidth, canvasHeight);
      expect(result).toBe(false);
    });

    it('should handle edge cases', () => {
      // Point on edge
      expect(isPointInLayer(100, 100, layer, canvasWidth, canvasHeight)).toBe(true);
      expect(isPointInLayer(300, 250, layer, canvasWidth, canvasHeight)).toBe(true);
      
      // Point just outside edge
      expect(isPointInLayer(99, 100, layer, canvasWidth, canvasHeight)).toBe(false);
      expect(isPointInLayer(301, 250, layer, canvasWidth, canvasHeight)).toBe(false);
    });
  });
});
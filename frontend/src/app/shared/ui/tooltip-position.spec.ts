import { tooltipPosition } from './tooltip-position';
describe('tooltip positioning', () => {
  it('stays next to the point and flips at the right and top viewport edges', () => {
    const center = tooltipPosition(
      { x: 400, y: 300 },
      { width: 180, height: 90 },
      { width: 1000, height: 700 },
    );
    expect(center.left).toBeGreaterThan(400);
    expect(center.top + 90).toBeLessThan(300);
    const edge = tooltipPosition(
      { x: 980, y: 20 },
      { width: 180, height: 90 },
      { width: 1000, height: 700 },
    );
    expect(edge.left + 180).toBeLessThan(980);
    expect(edge.top).toBeGreaterThan(20);
  });
  it('keeps the tooltip on a narrow screen at the bottom edge', () => {
    const position = tooltipPosition(
      { x: 20, y: 760 },
      { width: 260, height: 120 },
      { width: 390, height: 844 },
    );
    expect(position.left).toBeGreaterThanOrEqual(8);
    expect(position.left + 260).toBeLessThanOrEqual(382);
    expect(position.top + 120).toBeLessThanOrEqual(836);
  });
});

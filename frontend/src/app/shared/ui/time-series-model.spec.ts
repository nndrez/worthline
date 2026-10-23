import { timeSeriesModel, TimeSeries } from './time-series-model';
const lines: TimeSeries[] = [
  { key: 'cash', label: 'Cash', color: 'black' },
  { key: 'fund', label: 'Fund', color: 'gray' },
];
describe('time series geometry', () => {
  it('uses the observed range rather than forcing the axis to zero', () => {
    const graph = timeSeriesModel(
      [
        { month: '2026-01', values: { cash: '47000', fund: null } },
        { month: '2026-02', values: { cash: '48000', fund: null } },
      ],
      lines,
      500,
      250,
    )!;
    expect(Number(graph.min)).toBeGreaterThan(46000);
    expect(Number(graph.max)).toBeLessThan(49000);
    expect(graph.points[0].dots[0].y).toBeGreaterThan(graph.points[1].dots[0].y!);
  });
  it('splits each series independently across missing snapshots and preserves zero and negative values', () => {
    const graph = timeSeriesModel(
      [
        { month: '2026-01', values: { cash: '0', fund: '-5' } },
        { month: '2026-02', values: { cash: null, fund: '10' } },
        { month: '2026-03', values: { cash: '20', fund: null } },
      ],
      lines,
      320,
      180,
    )!;
    expect(graph.lines[0].segments).toHaveLength(2);
    expect(graph.lines[0].areas).toHaveLength(2);
    expect(graph.lines[0].areas.every((area) => area.endsWith(' Z'))).toBe(true);
    expect(graph.lines[1].segments).toHaveLength(1);
    expect(graph.points[1].dots[0].y).toBeNull();
    expect(graph.points[0].dots[0].y).not.toBeNull();
    expect(Number(graph.min)).toBeLessThan(-5);
  });
  it('handles constant values without invalid coordinates and does not fabricate an empty series', () => {
    const graph = timeSeriesModel(
      [{ month: '2026-01', values: { cash: '0', fund: null } }],
      lines,
      300,
      100,
    )!;
    expect(Number.isFinite(graph.points[0].dots[0].y)).toBe(true);
    expect(
      timeSeriesModel([{ month: '2026-01', values: { cash: null, fund: null } }], lines, 300, 100),
    ).toBeNull();
  });
  it('recalculates the scale for the visible series and preserves decimal differences', () => {
    const graph = timeSeriesModel(
      [
        { month: '2026-01', values: { cash: '0.01', fund: '99999.99' } },
        { month: '2026-02', values: { cash: '0.02', fund: '88888.88' } },
      ],
      lines.slice(0, 1),
      300,
      150,
    )!;
    expect(Number(graph.max)).toBeLessThan(0.03);
    expect(graph.lines).toHaveLength(1);
  });
});

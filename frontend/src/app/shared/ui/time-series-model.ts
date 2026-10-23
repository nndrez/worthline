import Decimal from 'decimal.js';
import { DecimalValue } from '../utils/money';

export interface TimeSeries {
  key: string;
  label: string;
  color: string;
}
export interface TimePoint {
  month: string;
  values: Readonly<Record<string, DecimalValue | null>>;
  detail?: string;
  total?: DecimalValue | null;
}

/** Decimal values are converted to numbers only after mapping into chart coordinates. */
export function timeSeriesModel(
  points: readonly TimePoint[],
  series: readonly TimeSeries[],
  width: number,
  height: number,
  compact = false,
) {
  const values = points.flatMap((point) =>
    series.flatMap((line) =>
      point.values[line.key] == null ? [] : [new Decimal(point.values[line.key]!)],
    ),
  );
  if (!values.length) return null;
  const low = Decimal.min(...values);
  const high = Decimal.max(...values);
  const span = high.minus(low);
  const padding = span.isZero() ? Decimal.max(high.abs().mul('.08'), 1) : span.mul('.12');
  const min = low.minus(padding);
  const max = high.plus(padding);
  const range = max.minus(min);
  const left = compact ? 8 : 58;
  const right = compact ? 10 : 22;
  const top = 10;
  const bottom = Math.max(top + 12, height - 25);
  const plotWidth = Math.max(20, width - left - right);
  const y = (value: DecimalValue) =>
    top +
    max
      .minus(value)
      .div(range)
      .mul(bottom - top)
      .toNumber();
  const plotted = points.map((point, index) => ({
    ...point,
    x: left + (index / Math.max(1, points.length - 1)) * plotWidth,
    label: new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: 'UTC' }).format(
      new Date(point.month + '-01T12:00:00Z'),
    ),
    dots: series.map((line) => ({
      key: line.key,
      color: line.color,
      y: point.values[line.key] == null ? null : y(point.values[line.key]!),
    })),
  }));
  const lines = series.map((line) => {
    const segments: string[] = [];
    const areas: string[] = [];
    let path = '';
    let start = 0;
    let end = 0;
    const baseline = low.isNegative() && high.isPositive() ? y(0) : high.lte(0) ? top : bottom;
    const flush = () => {
      if (!path) return;
      segments.push(path);
      areas.push(`${path} L${end},${baseline} L${start},${baseline} Z`);
      path = '';
    };
    for (const point of plotted) {
      const value = point.values[line.key];
      if (value == null) flush();
      else {
        if (!path) start = point.x;
        end = point.x;
        path += `${path ? ' L' : 'M'}${point.x},${y(value)}`;
      }
    }
    flush();
    return { ...line, segments, areas };
  });
  const count = height < 160 ? 3 : 4;
  const ticks = Array.from({ length: count }, (_, index) => {
    const value = max.minus(range.mul(index).div(count - 1));
    return {
      y: top + (index / (count - 1)) * (bottom - top),
      label:
        new Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 1 }).format(
          value.toNumber(),
        ) + ' €',
    };
  });
  return {
    points: plotted,
    lines,
    ticks,
    width,
    height,
    left,
    right,
    top,
    bottom,
    step: plotWidth / Math.max(1, points.length - 1),
    min: min.toString(),
    max: max.toString(),
  };
}

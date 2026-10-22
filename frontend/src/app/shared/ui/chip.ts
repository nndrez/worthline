import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.positive-chip]': "tone() === 'positive'",
    '[class.negative-chip]': "tone() === 'negative'",
  },
  template: '<ng-content />',
  styleUrl: './chip.css',
})
export class Chip {
  readonly tone = input<'neutral' | 'positive' | 'negative'>('neutral');
}

import { Pipe, PipeTransform } from '@angular/core';
import { DecimalValue, formatMoney } from './money';
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: DecimalValue | null | undefined): string {
    return formatMoney(value);
  }
}

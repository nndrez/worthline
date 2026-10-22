import { Pipe, PipeTransform } from '@angular/core';
import { UiSelectOption } from './select';

interface NamedOption {
  readonly id: string;
  readonly name: string;
  readonly parentId?: string | null;
}

@Pipe({ name: 'uiOptions' })
export class UiOptions implements PipeTransform {
  transform(
    items: readonly NamedOption[] | null | undefined,
    emptyLabel?: string,
  ): UiSelectOption<string>[] {
    const options = (items ?? []).map((item) => {
      const parent = items?.find((candidate) => candidate.id === item.parentId);
      return { value: item.id, label: parent ? `${parent.name} / ${item.name}` : item.name };
    });
    return emptyLabel ? [{ value: '', label: emptyLabel }, ...options] : options;
  }
}

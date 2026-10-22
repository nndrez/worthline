import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom, of } from 'rxjs';
import { ApiTransport } from './api-transport';
import { collectPages, PageResponse, pageIndex } from './page';

describe('API boundary', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('preserves decimal lexemes while keeping page metadata numeric', async () => {
    const result = firstValueFrom(
      TestBed.inject(ApiTransport).get<{ amount: string; page: number }>('/test', {
        page: 0,
        name: 'Test',
        type: undefined,
      }),
    );
    const request = TestBed.inject(HttpTestingController).expectOne('/api/test?page=0&name=Test');
    request.flush('{"amount":99999999999999999.99,"page":1}');
    expect(await result).toEqual({ amount: '99999999999999999.99', page: 1 });
  });
  it('serializes decimal strings and supports empty delete responses', async () => {
    const transport = TestBed.inject(ApiTransport);
    const saved = firstValueFrom(transport.post('/monthly-balances', { amount: '0.10' }));
    const request = TestBed.inject(HttpTestingController).expectOne('/api/monthly-balances');
    expect(request.request.body).toEqual({ amount: '0.10' });
    request.flush('{"id":"test"}');
    await saved;
    const deleted = firstValueFrom(transport.delete('/monthly-balances/test'));
    TestBed.inject(HttpTestingController)
      .expectOne('/api/monthly-balances/test')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(await deleted).toBeUndefined();
  });
  it('reads every report page using zero-based requests and one-based response metadata', async () => {
    const indexes: number[] = [];
    const result = await firstValueFrom(
      collectPages((index) => {
        indexes.push(index);
        return of<PageResponse<number>>({
          content: [index],
          page: {
            currentPage: index + 1,
            size: 1,
            totalElements: 3,
            totalPages: 3,
            first: index === 0,
            last: index === 2,
          },
        });
      }),
    );
    expect(indexes).toEqual([0, 1, 2]);
    expect(result).toEqual([0, 1, 2]);
    expect(
      pageIndex({
        currentPage: 3,
        size: 1,
        totalElements: 3,
        totalPages: 3,
        first: false,
        last: true,
      }),
    ).toBe(2);
  });
});

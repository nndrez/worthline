# Worthline backend

Java 21, Spring Boot, Spring Modulith, PostgreSQL and Flyway.

## Run

Create a PostgreSQL database and provide these environment variables:

| Variable | Default |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/worthline` |
| `DB_USERNAME` | `worthline` |
| `DB_PASSWORD` | Required |

With `JAVA_HOME` pointing to JDK 21, run `./mvnw spring-boot:run` (`.\mvnw.cmd spring-boot:run` on Windows) from this directory. The API listens on port 8080. Flyway applies the schema; Hibernate only validates it. No financial data is seeded or imported from the reference workbook.

Run `./mvnw test` to verify module boundaries, money precision, migrations and HTTP workflows. Integration tests require Docker and start their own disposable PostgreSQL 17 database. They use synthetic data and do not connect to the application database.

## Modules and workflow

- `transactions`: manually recorded income and expenses, dynamic categories and subcategories, optional tag and notes. No account or payment card is required.
- `wealth`: accounts representing cash, investment holdings or pensions, with manually entered month-end valuations. Transactions and investment operations never change these snapshots.
- `portfolio`: instruments and manually entered buy, sell and dividend operations. No market-data lookup or automatic reconciliation is performed.
- `core`: shared EUR money contract and consistent HTTP errors.

All externally visible identifiers are UUIDs. Dates use `yyyy-MM-dd`. Money uses decimal amounts with at most two fractional digits, always EUR; extra precision is rejected rather than silently rounded. Expense and income amounts are positive, with the direction represented by `type`. Negative monthly balances are allowed for overdrafts. Unit prices and quantities support up to six fractional digits.

Categories are database records, not enum constants. `parentId: null` denotes a primary category; a subcategory references a primary category of the same `INCOME` or `EXPENSE` type. Transactions reference either level using `categoryId`; the primary category can be derived from the parent. Category names are unique within their type and parent, ignoring case and surrounding spaces. Names can be edited; type and parent remain fixed to preserve existing classification. Delete and recreate an unused category to change its structure. Categories with children or transactions cannot be deleted.

Each account can have exactly one balance per month, dated on the last calendar day. A missing snapshot is absent from the response; a recorded zero remains a zero. No earlier value is carried forward automatically. For investment accounts, enter the total holding valuation once per account to avoid counting the same instrument twice. The account type is one of `CASH`, `INVESTMENT`, `PENSION`.

Investment operation types are `BUY`, `SELL`, `DIVIDEND`. For trades, enter positive `quantity`, `unitPrice` and the final `amount` manually; `amount` is authoritative and can include broker adjustments or fees, so it is not recalculated from price and quantity. A dividend has only an amount, with price and quantity omitted. Sells keep positive quantities; `type` supplies direction. Operations do not enforce available holdings or calculate taxes, realized gains or market value in this initial CRUD implementation.

## Resources

Every resource supports `POST` to create, `GET /{id}` to read, `PUT /{id}` to replace and `DELETE /{id}` to delete. Creates return `201` and a `Location` header; deletes return `204`. PUT requires the complete resource payload and returns `404` for an unknown identifier. Resources referenced by other records cannot be deleted.

| Collection | List parameters |
| --- | --- |
| `/api/categories` | `name`, `type`, `parentId`, `rootOnly`; default sort `name,asc` |
| `/api/transactions` | Inclusive `from`, `to`, plus `type`, `categoryId`, `description`, `tag`; default sort `date,desc` |
| `/api/accounts` | `name`, `type`; default sort `name,asc` |
| `/api/monthly-balances` | `accountId`, exact month-end `date`, inclusive `from`, `to`; default sort `date,desc` |
| `/api/instruments` | `code`, `name`, `isin`, `ticker`; default sort `code,asc` |
| `/api/investment-operations` | Inclusive `from`, `to`, plus `type`, `instrumentId`, `broker`, `market`; default sort `date,desc` |

Every collection uses its own immutable search criteria record, composable JPA Specification and `JpaSpecificationExecutor`. Filters are optional and combined with AND. Text filters are case-insensitive literal substring matches (including literal `%` and `_`); UUIDs, enum types and dates are exact matches. An omitted balance date searches across all months.

All collections accept Spring Data `Pageable` parameters: zero-based `page` (default 0), `size` (default 20, maximum 100) and repeatable `sort=field,asc|desc`. UUID sorting is always appended to keep page boundaries deterministic. Pageable uses Spring Data's standard normalization for invalid page sizes and page numbers. Unknown sort properties return 400.

Responses follow Insula's `PageResponse` shape, with one-based `page.currentPage`:

```json
{
  "content": [],
  "page": {
    "currentPage": 1,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0,
    "first": true,
    "last": true
  }
}
```

For example: `GET /api/transactions?from=2026-01-01&to=2026-01-31&type=EXPENSE&page=0&size=20&sort=amount,desc`. There are no unpaginated list endpoints.

Example payloads (replace placeholder IDs with identifiers returned by POST):

```json
{"name":"Food","type":"EXPENSE","parentId":null}
```

```json
{"name":"Groceries","type":"EXPENSE","parentId":"<primary-category-id>"}
```

```json
{"date":"2026-01-15","description":"Synthetic purchase","amount":25.50,"type":"EXPENSE","categoryId":"<category-id>","tag":"Shopping","notes":null}
```

```json
{"name":"Checking account","type":"CASH"}
```

```json
{"accountId":"<account-id>","date":"2026-01-31","amount":1250.00}
```

```json
{"code":"TEST","name":"Synthetic fund","isin":null,"ticker":"TEST"}
```

```json
{"instrumentId":"<instrument-id>","date":"2026-01-15","type":"BUY","market":"Test exchange","broker":"Test broker","unitPrice":25.125,"quantity":2,"amount":50.25,"notes":null}
```

## Errors

The API returns a consistent body with `errorCode`, `message`, `fields` and `requestId`. Errors follow Insula's domain enum pattern through the shared `ErrorDefinition` interface: `TransactionsErrorCodes`, `WealthErrorCodes`, `PortfolioErrorCodes` and `CommonErrorCodes`. Each enum owns an explicit stable dotted `errorCode`, a safe fallback message and a failure kind. Exceptions accept an enum rather than ad hoc strings. The frontend translates `errorCode`, for example `category.type.mismatch`, `account.not.found` or `common.request.invalid`; translation keys are independent of enum constant names. No numeric application code is added. Validation errors include field details; internal exceptions, SQL and submitted financial descriptions are not returned. Unexpected failures are logged once with a generated request ID and exception type, without exception messages or request bodies.

| Status | Meaning |
| --- | --- |
| 400 | Malformed JSON, invalid enum/UUID/date, missing field, invalid amount or pagination |
| 404 | Resource not found |
| 409 | Duplicate name/balance, referenced resource, immutable category structure |
| 422 | Category mismatch, invalid hierarchy, non-month-end date, reversed date range or incomplete trade |
| 500 | Unexpected failure with a request ID |

MapStruct 1.6.3 (latest stable version checked on 2026-10-21) generates explicit flat entity/record mappings with unmapped targets treated as compilation errors. The annotation processor is configured in Maven; the 1.7 beta is intentionally excluded.

Lombok 1.18.48 (latest stable version checked on 2026-10-21) generates entity accessors, no-argument constructors, dependency-injection constructors, enum getters/constructors and the exception handler logger. DTOs remain Java records. Entity equality and `toString` are not generated; currency setters remain disabled. Maven configures both Lombok and `lombok-mapstruct-binding` 0.2.0 alongside MapStruct so generated accessors are visible during mapping generation.

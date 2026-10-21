# Worthline backend — AGENTS.md

These instructions apply to `backend/`. Keep changes consistent with the existing Maven project and the conventions below. The reference project is Insula; adopt the architectural practices that fit Worthline and do not copy Insula-specific tenancy, agency, reservation, or platform-admin behavior.

## Project context

- Worthline is a single-user personal finance and net-worth application. Do not add multi-tenancy.
- Backend: Java 21, Spring Boot, Maven, Spring Modulith, Spring Data JPA, PostgreSQL, and Flyway. Keep dependency versions managed by Spring Boot and the Spring Modulith BOM; avoid unnecessary overrides.
- Keep the Maven target aligned to Java 21.
- Main package: `it.andrea.worthline`. Each direct child package is a Spring Modulith application module.

## Critical rules

- Do not put controllers, services, repositories, entities, mappers, or other implementation classes in a module's root package. Put implementations in `internal.<area>` packages.
- Never depend on another module's `internal` package. Depend only on its published API or a named interface. Avoid cyclic module dependencies.
- Use Java records for immutable API request/response DTOs, module contracts, commands, query results, events, and value objects where appropriate.
- Do not use records for JPA entities or objects with mutable lifecycle/state.
- Do not use `var`; keep types explicit.
- Keep methods focused and normally limited to 0–3 parameters. For 4+ related parameters, introduce a record that names the concept.
- Do not expose JPA entities from controllers or module APIs. Do not let mappers traverse lazy collections.
- Do not use `double` or `float` for money. Use `BigDecimal`, explicit currency, and deliberate scale/rounding rules.

## Spring Modulith structure

Use a domain-oriented package layout. Start with the feature currently being implemented; do not create empty modules in anticipation of every future feature.

```text
it.andrea.worthline
├── WorthlineApplication.java
├── transactions
│   ├── TransactionQuery.java             # optional public module API
│   ├── TransactionSummary.java            # immutable public contract, if needed
│   └── internal
│       ├── expense
│       │   ├── web
│       │   ├── dto
│       │   ├── mapper
│       │   ├── model
│       │   └── service
│       └── income
├── wealth
├── portfolio
└── reporting
```

- A module root is its public boundary: expose only contracts other modules need (interfaces, records, enums, and events). Keep implementation details under `internal`.
- Keep HTTP DTOs, JPA entities, repositories, controllers, validators, and implementation services internal to their owning module.
- Use synchronous module APIs for direct queries/commands. Use Spring Modulith application events for genuinely decoupled side effects; publish immutable event records and consume cross-module events with `@ApplicationModuleListener`. Do not introduce events for ordinary in-module calls.
- Add `core` only when a genuinely shared concept emerges. Do not use it as a dumping ground.
- After changing module boundaries or dependencies, verify the structure with `ApplicationModules.of(WorthlineApplication.class).verify()` in an architecture test.

## Records, validation, and mapping

- Define REST request and response DTOs as records. Put Jakarta Bean Validation constraints on request records; validate at the HTTP boundary. Use compact constructors for internal value-object invariants and normalization, not as a second layer of REST validation.
- Keep business rules in a focused domain validator/service, separate from syntactic request validation.
- Use explicit mapper functions between request DTOs, domain objects, and response DTOs. Never serialize persistence entities directly.
- Use record accessors (`amount()`, `date()`), not bean getters.
- Use Lombok for entity accessors and constructors, dependency-injection constructors, enum boilerplate and loggers. Keep DTOs as records. Avoid `@Data`, generated equality and generated `toString` on JPA entities. Keep Lombok at the latest stable version and configure `lombok-mapstruct-binding` with the annotation processors.
- A record used to group method arguments must validate its own invariants in its compact constructor.

## Error handling

- Centralize HTTP error translation in one `@RestControllerAdvice`; controllers and services must not build ad hoc error responses.
- Use a small, typed exception hierarchy for expected failures (for example not found, conflict, and business-rule violation). Do not use generic `RuntimeException` for normal domain outcomes.
- Define stable, language-neutral error codes owned by the relevant module. Return a consistent error record/problem response containing the code and safe details; the frontend can turn codes into user-facing text.
- Define errors as per-module enums implementing `ErrorDefinition`, following Insula's pattern without numeric application codes. Each enum defines an explicit stable dotted `errorCode` (for example `category.type.mismatch`), exposed through `getErrorCode()` and the response's `errorCode` field for frontend translation. Do not expose enum constant names as translation keys. Exceptions accept an enum definition; services must not create errors from arbitrary strings.
- Map errors deliberately: malformed/invalid input to 400, missing resources to 404, state conflicts to 409, business rules to 422, and unexpected failures to 500.
- Include field-level validation details where useful. Never return stack traces, SQL, secrets, or internal exception messages to the client. Log unexpected failures once at the boundary with a correlation/request id when available.
- Do not swallow exceptions, return `null` to signal failure, or catch `Exception` broadly in ordinary business code.

## Persistence, money, and time

- PostgreSQL is the source of truth. Manage schema changes with ordered Flyway migrations; do not rely on Hibernate `ddl-auto=create` or `update` outside disposable experiments.
- Keep repository access inside the owning module. Put transaction boundaries on application/service operations, not controllers. Mark read-only queries `@Transactional(readOnly = true)` where appropriate.
- Keep persistence models simple: do not add a shared `BaseEntity`, automatic auditing, `createdAt`/`updatedAt`, `createdBy`/`updatedBy`, change-history tables, or update/version tracking unless a concrete requested feature needs them.
- Use a stable UUID as an externally visible identifier; keep database implementation identifiers internal when they are needed.
- Use the modern `java.time` API. Represent expense/income dates, trade dates, and monthly valuation dates as `LocalDate` whenever time of day is not part of the requirement.
- Do not introduce `Instant`, legacy `Date`/`Calendar`, or timestamp fields without a concrete requirement for an absolute point in time.
- Inject `Clock` for date-dependent behavior and use `LocalDate.now(clock)`; do not call bare `LocalDate.now()` or rely on the JVM default time zone. Configure the application time zone explicitly when a feature needs to determine the current civil date.
- Treat a missing amount differently from zero. Preserve sign and currency semantics explicitly, and centralize rounding rules rather than scattering them through controllers or mappers.

## HTTP, privacy, and configuration

- Keep controllers thin: parse/validate HTTP input, delegate to a module service, and return a response DTO. Do not put business calculations or persistence logic in controllers.
- Use standard resource-oriented REST semantics and correct status codes. For creates, return 201 and a `Location` header; for successful deletes without a body, return 204.
- Every collection endpoint uses a search criteria record, composable JPA Specifications, `JpaSpecificationExecutor` and Spring Data `Pageable`. Return `PageResponse` with `content` and `page` metadata, following Insula. Do not add unpaginated list endpoints. Request pages are zero-based; response `currentPage` is one-based. Append UUID ordering to keep pagination stable.
- Authentication and authorization must not be evaluated or proposed as part of ordinary implementation work; the user will decide and plan them separately.
- Do not log financial descriptions or full request bodies.
- Keep secrets and real financial data out of source control, demo seeds, logs, and exception messages. Use environment variables/local ignored configuration for secrets.

## Code and verification practices

- Prefer small, cohesive classes and explicit names. Extract substantive calculations into domain services/calculators instead of dense controller or repository methods.
- Keep dependency directions intentional: web → application/domain → persistence abstractions; avoid technical-layer packages that become cross-module shared APIs.
- Add focused unit, web-slice, integration, and architecture tests when tests are part of the requested change. Use PostgreSQL Testcontainers for persistence integration tests; do not substitute H2 for PostgreSQL behavior.
- Keep tests deterministic: inject a fixed `Clock` for time-sensitive rules and use synthetic financial data.
- Run the narrowest verification requested by the user and report what was run and any gaps.





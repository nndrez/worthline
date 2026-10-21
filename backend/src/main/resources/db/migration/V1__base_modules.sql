CREATE TABLE categories (
    id uuid PRIMARY KEY,
    name varchar(100) NOT NULL CHECK (length(trim(name)) > 0),
    type varchar(16) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    parent_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
    CHECK (parent_id IS NULL OR parent_id <> id),
    UNIQUE (id, type),
    FOREIGN KEY (parent_id, type) REFERENCES categories(id, type) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX categories_root_name ON categories(type, lower(trim(name))) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX categories_child_name ON categories(parent_id, lower(trim(name))) WHERE parent_id IS NOT NULL;

CREATE TABLE transactions (
    id uuid PRIMARY KEY,
    transaction_date date NOT NULL,
    description varchar(255) NOT NULL CHECK (length(trim(description)) > 0),
    amount numeric(19,2) NOT NULL CHECK (amount > 0),
    currency varchar(3) NOT NULL CHECK (currency = 'EUR'),
    type varchar(16) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category_id uuid NOT NULL,
    tag varchar(100),
    notes varchar(2000),
    FOREIGN KEY (category_id, type) REFERENCES categories(id, type) ON DELETE RESTRICT
);
CREATE INDEX transactions_date ON transactions(transaction_date, id);
CREATE INDEX transactions_category ON transactions(category_id);

CREATE TABLE accounts (
    id uuid PRIMARY KEY,
    name varchar(100) NOT NULL CHECK (length(trim(name)) > 0),
    type varchar(16) NOT NULL CHECK (type IN ('CASH', 'INVESTMENT', 'PENSION'))
);
CREATE UNIQUE INDEX accounts_name ON accounts(lower(trim(name)));

CREATE TABLE monthly_balances (
    id uuid PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    balance_date date NOT NULL,
    amount numeric(19,2) NOT NULL,
    currency varchar(3) NOT NULL CHECK (currency = 'EUR'),
    CHECK (balance_date = (date_trunc('month', balance_date) + interval '1 month - 1 day')::date),
    UNIQUE (account_id, balance_date)
);
CREATE INDEX monthly_balances_date ON monthly_balances(balance_date);

CREATE TABLE instruments (
    id uuid PRIMARY KEY,
    code varchar(32) NOT NULL CHECK (code ~ '^[A-Z0-9][A-Z0-9._-]{0,31}$'),
    name varchar(255) NOT NULL CHECK (length(trim(name)) > 0),
    isin varchar(12) CHECK (isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
    ticker varchar(32),
    UNIQUE (code),
    UNIQUE (isin)
);

CREATE TABLE investment_operations (
    id uuid PRIMARY KEY,
    instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE RESTRICT,
    operation_date date NOT NULL,
    type varchar(16) NOT NULL CHECK (type IN ('BUY', 'SELL', 'DIVIDEND')),
    market varchar(100),
    broker varchar(100),
    unit_price numeric(19,6),
    quantity numeric(19,6),
    amount numeric(19,2) NOT NULL CHECK (amount > 0),
    currency varchar(3) NOT NULL CHECK (currency = 'EUR'),
    notes varchar(2000),
    CHECK ((type = 'DIVIDEND' AND unit_price IS NULL AND quantity IS NULL)
        OR (type IN ('BUY', 'SELL') AND unit_price IS NOT NULL AND quantity IS NOT NULL
            AND unit_price > 0 AND quantity > 0))
);
CREATE INDEX investment_operations_date ON investment_operations(operation_date, id);
CREATE INDEX investment_operations_instrument ON investment_operations(instrument_id);

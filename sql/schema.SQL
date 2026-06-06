CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    amount NUMERIC(12, 2) NOT NULL, 
    currency VARCHAR(10) NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    gate_tx_id VARCHAR(100),
    tx_status VARCHAR(20) NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE idempotency_keys (
    id SERIAL PRIMARY KEY,
    idem_key VARCHAR(255) UNIQUE NOT NULL,
    request_hash TEXT NOT NULL,
    tx_status VARCHAR(20) NOT NULL,
    status_code INT NOT NULL,
    response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);


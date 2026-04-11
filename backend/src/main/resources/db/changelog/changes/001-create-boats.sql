--liquibase formatted sql

--changeset dorian:001-create-boats
create table boats (
    id uuid primary key,
    name varchar(255) not null,
    description varchar(5000),
    created_by varchar(256) not null,
    created_at timestamp with time zone not null
);

--rollback drop table if exists boats;

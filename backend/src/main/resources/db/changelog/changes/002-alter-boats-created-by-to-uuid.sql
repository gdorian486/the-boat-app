--liquibase formatted sql

--changeset dorian:002-alter-boats-created-by-to-uuid
alter table boats
    alter column created_by type uuid
    using created_by::uuid;

--rollback alter table boats alter column created_by type varchar(256) using created_by::varchar(256);

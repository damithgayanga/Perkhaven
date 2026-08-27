-- Production-only initial cleanup. Flyway history is intentionally preserved.
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> 'flyway_schema_history'
    LOOP
        EXECUTE format(
            'TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE',
            table_name
        );
    END LOOP;
END $$;

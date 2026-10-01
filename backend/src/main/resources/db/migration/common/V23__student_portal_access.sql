ALTER TABLE students ADD COLUMN portal_access_status VARCHAR(30) NOT NULL DEFAULT 'NOT_GRANTED';
ALTER TABLE students ADD COLUMN portal_access_granted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN portal_activated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN portal_last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN portal_access_disabled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN portal_access_updated_by VARCHAR(255);

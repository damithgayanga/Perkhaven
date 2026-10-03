ALTER TABLE agreements ADD COLUMN minimum_stay_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agreements ADD COLUMN checkout_notice_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agreements ADD COLUMN hostel_rules_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agreements ADD COLUMN inventory_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE agreements ADD COLUMN confirmation_snapshot_json TEXT;

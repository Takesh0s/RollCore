-- Lets an event notification open the event page. No foreign key on purpose, like table_id:
-- the notification outlives the event if it is deleted.
ALTER TABLE notifications ADD COLUMN event_id UUID;

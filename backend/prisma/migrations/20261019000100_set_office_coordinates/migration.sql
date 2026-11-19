-- Set the supplied office location for the default attendance configuration.
-- Preserve an administrator-configured location if it has already been changed.
UPDATE "AttendanceRule"
SET "officeLat" = 21.175055,
    "officeLng" = 79.050930
WHERE "id" = 'default'
  AND "officeLat" = 18.5204
  AND "officeLng" = 73.8567;

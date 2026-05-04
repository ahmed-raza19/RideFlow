-- =============================================================
-- RideFlow — Master Runner
-- Run this single file to execute ALL phases in sequence.
-- Usage:  mysql -u root -p < run_all.sql
-- =============================================================

SOURCE 00_setup.sql
SOURCE 02_schema.sql
SOURCE 03_seed.sql
SOURCE 04_triggers.sql
SOURCE 05_procedures.sql
SOURCE 06_views.sql
SOURCE 07_dcl.sql
SOURCE 08_indexes.sql
SOURCE 09_reports.sql

SELECT '=====================================================' AS '';
SELECT ' RideFlow — All phases executed successfully!        ' AS '';
SELECT '=====================================================' AS '';

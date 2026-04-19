ALTER TABLE `databases`
  ADD COLUMN creator_id CHAR(36) NULL AFTER id,
  ADD KEY idx_databases_creator_id (creator_id);

ALTER TABLE `databases`
  ADD CONSTRAINT fk_databases_creator
  FOREIGN KEY (creator_id)
  REFERENCES `users` (id)
  ON DELETE SET NULL;

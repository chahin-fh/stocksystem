CREATE TABLE IF NOT EXISTS `databases` (
  id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  field_count INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `fields` (
  id CHAR(36) NOT NULL,
  database_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(32) NOT NULL,
  required TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_fields_database_id (database_id),
  CONSTRAINT fk_fields_database FOREIGN KEY (database_id)
    REFERENCES `databases` (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `records` (
  id CHAR(36) NOT NULL,
  database_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_records_database_id (database_id),
  CONSTRAINT fk_records_database FOREIGN KEY (database_id)
    REFERENCES `databases` (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `record_values` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  record_id CHAR(36) NOT NULL,
  field_id CHAR(36) NOT NULL,
  value_text TEXT NULL,
  value_bool TINYINT(1) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_record_field (record_id, field_id),
  KEY idx_record_values_record_id (record_id),
  KEY idx_record_values_field_id (field_id),
  CONSTRAINT fk_record_values_record FOREIGN KEY (record_id)
    REFERENCES `records` (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_record_values_field FOREIGN KEY (field_id)
    REFERENCES `fields` (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `activities` (
  id CHAR(36) NOT NULL,
  database_id CHAR(36) NOT NULL,
  action VARCHAR(500) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_activities_database_id_created_at (database_id, created_at),
  CONSTRAINT fk_activities_database FOREIGN KEY (database_id)
    REFERENCES `databases` (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `migrations` (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename VARCHAR(255) NOT NULL,
  applied_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_migrations_filename (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

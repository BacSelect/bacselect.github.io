CREATE TABLE IF NOT EXISTS panel_download_counts (
  panel_identity TEXT NOT NULL,
  panel_n INTEGER NOT NULL CHECK(panel_n BETWEEN 10 AND 500),
  format TEXT NOT NULL CHECK(format IN ('xlsx', 'tsv', 'txt')),
  download_count INTEGER NOT NULL DEFAULT 0 CHECK(download_count >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (panel_identity, panel_n, format)
);

-- 워크플로우 폴더 테이블 생성
CREATE TABLE IF NOT EXISTS workflow_folders (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parent_folder FOREIGN KEY (parent_id) REFERENCES workflow_folders(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_workflow_folders_parent_id ON workflow_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_workflow_folders_name ON workflow_folders(name);


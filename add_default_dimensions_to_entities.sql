-- DCBI Expense Tool - Add Default Dimensions to Entities
-- This script adds columns for default Project and Department at the Legal Entity level.

ALTER TABLE "public"."entities" ADD COLUMN IF NOT EXISTS "default_project_id" TEXT REFERENCES "public"."projects"("id");
ALTER TABLE "public"."entities" ADD COLUMN IF NOT EXISTS "default_department_id" TEXT REFERENCES "public"."departments"("id");

COMMENT ON COLUMN "public"."entities"."default_project_id" IS 'Default Project ID to auto-populate in claims for this entity';
COMMENT ON COLUMN "public"."entities"."default_department_id" IS 'Default Department ID to auto-populate in claims for this entity';

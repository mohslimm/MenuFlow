@echo off
call npx.cmd supabase init
mkdir supabase\migrations
move schema.sql supabase\migrations\20240320000000_init_schema.sql

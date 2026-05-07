-- Surface indexing failures in the UI without making the user dig in Render logs.
alter table code_repos add column if not exists failure_reason text;

begin;
create extension if not exists pgcrypto;
create table if not exists public.hub_materials(id uuid primary key default gen_random_uuid(),title text not null,current_version_id uuid,status text not null default 'published' check(status in('draft','published','archived')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.hub_material_versions(id uuid primary key default gen_random_uuid(),material_id uuid not null references public.hub_materials(id) on delete cascade,version_number integer not null check(version_number>0),document_json jsonb not null,created_at timestamptz not null default now(),unique(material_id,version_number));
alter table public.hub_materials drop constraint if exists hub_materials_current_version_fkey;
alter table public.hub_materials add constraint hub_materials_current_version_fkey foreign key(current_version_id) references public.hub_material_versions(id) on delete set null;
create table if not exists public.hub_attempts(id uuid primary key default gen_random_uuid(),material_version_id uuid not null references public.hub_material_versions(id) on delete restrict,learner_name text not null check(length(learner_name) between 1 and 80),status text not null check(status in('in-progress','completed')),score numeric check(score between 0 and 100),exp_awarded integer not null default 0,started_at timestamptz not null default now(),completed_at timestamptz);
create table if not exists public.hub_answers(id uuid primary key default gen_random_uuid(),attempt_id uuid not null references public.hub_attempts(id) on delete cascade,question_id text not null,answer_text text,answer_json jsonb,is_correct boolean,created_at timestamptz not null default now(),unique(attempt_id,question_id));
create table if not exists public.hub_feedback(id uuid primary key default gen_random_uuid(),attempt_id uuid not null references public.hub_attempts(id) on delete cascade,question_id text,source text not null check(source in('auto','ai','teacher','system')),feedback_text text not null,score numeric check(score between 0 and 100),created_at timestamptz not null default now());
create table if not exists public.hub_characters(id uuid primary key default gen_random_uuid(),name text not null,stage text not null default 'egg' check(stage in('egg','child','learning-partner')),level integer not null default 1 check(level>0),exp integer not null default 0 check(exp>=0),design_json jsonb not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create or replace function public.hub_save_material(p_document jsonb,p_material_id uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare v_material_id uuid:=coalesce(p_material_id,gen_random_uuid());v_version_id uuid:=gen_random_uuid();v_next integer;v_title text:=trim(p_document->'metadata'->>'title');
begin
if v_title is null or v_title='' then raise exception 'material title is required';end if;
if p_material_id is null then insert into public.hub_materials(id,title,status) values(v_material_id,v_title,'published');elsif not exists(select 1 from public.hub_materials where id=v_material_id) then raise exception 'material not found';end if;
select coalesce(max(version_number),0)+1 into v_next from public.hub_material_versions where material_id=v_material_id;
insert into public.hub_material_versions(id,material_id,version_number,document_json) values(v_version_id,v_material_id,v_next,p_document);
update public.hub_materials set title=v_title,current_version_id=v_version_id,status='published',updated_at=now() where id=v_material_id;
return v_material_id;end$$;
alter table public.hub_materials enable row level security;alter table public.hub_material_versions enable row level security;alter table public.hub_attempts enable row level security;alter table public.hub_answers enable row level security;alter table public.hub_feedback enable row level security;alter table public.hub_characters enable row level security;
revoke all on table public.hub_materials,public.hub_material_versions,public.hub_attempts,public.hub_answers,public.hub_feedback,public.hub_characters from anon,authenticated;
grant all on table public.hub_materials,public.hub_material_versions,public.hub_attempts,public.hub_answers,public.hub_feedback,public.hub_characters to service_role;
revoke all on function public.hub_save_material(jsonb,uuid) from public,anon,authenticated;grant execute on function public.hub_save_material(jsonb,uuid) to service_role;
commit;

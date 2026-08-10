begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'personal' check (role in ('personal', 'student', 'teacher', 'admin')),
  display_name text not null check (char_length(display_name) between 1 and 80),
  grade_band text check (grade_band in ('elementary', 'middle', 'high', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hub_materials add column if not exists owner_id uuid references auth.users(id) on delete set null;
alter table public.hub_attempts add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.hub_characters add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists hub_materials_owner_id_idx on public.hub_materials(owner_id);
create index if not exists hub_attempts_user_id_idx on public.hub_attempts(user_id);
create index if not exists hub_characters_owner_id_idx on public.hub_characters(owner_id);

create table if not exists public.hub_user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_background_asset_id uuid,
  background_fit text not null default 'cover' check (background_fit in ('cover', 'contain')),
  background_position text not null default 'center' check (background_position in ('center', 'top', 'bottom', 'left', 'right')),
  background_overlay numeric not null default 0.64 check (background_overlay between 0.45 and 0.9),
  background_blur integer not null default 0 check (background_blur between 0 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_visual_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('material-background', 'material-scene', 'avatar', 'egg', 'child', 'learning-partner', 'app-background')),
  storage_path text not null unique,
  mime_type text not null default 'image/webp',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  generation_type text not null check (generation_type in ('ai', 'upload')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.hub_visual_assets add column if not exists material_id uuid references public.hub_materials(id) on delete cascade;
alter table public.hub_visual_assets add column if not exists material_version_id uuid references public.hub_material_versions(id) on delete set null;
create index if not exists hub_visual_assets_material_version_idx on public.hub_visual_assets(material_version_id);

alter table public.hub_user_settings
  drop constraint if exists hub_user_settings_active_background_asset_id_fkey;
alter table public.hub_user_settings
  add constraint hub_user_settings_active_background_asset_id_fkey
  foreign key (active_background_asset_id) references public.hub_visual_assets(id) on delete set null;

create table if not exists public.hub_character_assets (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.hub_characters(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  visual_asset_id uuid not null references public.hub_visual_assets(id) on delete restrict,
  stage text not null check (stage in ('egg', 'child', 'learning-partner')),
  storage_path text not null,
  generation_type text not null check (generation_type in ('ai', 'upload')),
  created_at timestamptz not null default now(),
  is_active boolean not null default false
);
create unique index if not exists hub_character_assets_one_active_idx on public.hub_character_assets(character_id) where is_active;
create index if not exists hub_character_assets_history_idx on public.hub_character_assets(character_id, created_at desc);

create table if not exists public.hub_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('material_completed', 'correct_answer', 'daily_learning', 'character_evolved')),
  dedupe_key text not null,
  exp_awarded integer not null check (exp_awarded >= 0),
  reference_id uuid,
  created_at timestamptz not null default now(),
  unique(user_id, dedupe_key)
);

create table if not exists public.hub_classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{8,10}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_classroom_members (
  classroom_id uuid not null references public.hub_classrooms(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

create table if not exists public.hub_assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.hub_classrooms(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  material_version_id uuid not null references public.hub_material_versions(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  instructions text not null default '' check (char_length(instructions) <= 4000),
  due_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hub_assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.hub_assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null references public.hub_attempts(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  submitted_at timestamptz,
  teacher_feedback text check (char_length(teacher_feedback) <= 5000),
  teacher_score numeric check (teacher_score between 0 and 100),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table if not exists public.hub_ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feature text not null check (feature in ('material', 'material-image', 'evaluation', 'character-design', 'character-image', 'background')),
  provider text not null default 'openai',
  model text not null,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  error_code text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists hub_classrooms_teacher_idx on public.hub_classrooms(teacher_id);
create index if not exists hub_classroom_members_student_idx on public.hub_classroom_members(student_id);
create index if not exists hub_assignments_classroom_idx on public.hub_assignments(classroom_id, published_at);
create index if not exists hub_submissions_assignment_idx on public.hub_assignment_submissions(assignment_id, status);
create index if not exists hub_activity_user_idx on public.hub_activity_logs(user_id, created_at desc);
create index if not exists hub_ai_generations_status_idx on public.hub_ai_generations(status, created_at desc);

create or replace function public.hub_set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.hub_protect_profile_role() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'role changes require administrator privileges';
  end if;
  return new;
end;
$$;

create or replace function public.hub_create_profile_for_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'requested_role';
  safe_role text;
  safe_grade text := new.raw_user_meta_data ->> 'grade_band';
  safe_name text := trim(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'ユーザー'));
begin
  safe_role := case when requested_role in ('personal', 'student') then requested_role else 'personal' end;
  if safe_role <> 'student' or safe_grade not in ('elementary', 'middle', 'high', 'other') then safe_grade := null; end if;
  insert into public.profiles(id, role, display_name, grade_band)
  values(new.id, safe_role, left(coalesce(nullif(safe_name, ''), 'ユーザー'), 80), safe_grade)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.hub_protect_submission_update() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_role text;
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if new.id is distinct from old.id
    or new.assignment_id is distinct from old.assignment_id
    or new.student_id is distinct from old.student_id
    or new.created_at is distinct from old.created_at then
    raise exception 'submission identity fields are immutable';
  end if;
  v_role := public.hub_current_role();
  if v_role = 'teacher' then
    if new.attempt_id is distinct from old.attempt_id or new.status <> 'reviewed' or new.reviewed_at is null then
      raise exception 'teacher review must set reviewed status';
    end if;
  elsif v_role = 'student' then
    if new.teacher_feedback is distinct from old.teacher_feedback
      or new.teacher_score is distinct from old.teacher_score
      or new.reviewed_at is distinct from old.reviewed_at
      or new.status not in ('draft', 'submitted') then
      raise exception 'students cannot modify review fields';
    end if;
  else
    raise exception 'role cannot update submissions';
  end if;
  return new;
end;
$$;

drop trigger if exists hub_profiles_updated_at on public.profiles;
create trigger hub_profiles_updated_at before update on public.profiles for each row execute function public.hub_set_updated_at();
drop trigger if exists hub_profiles_protect_role on public.profiles;
create trigger hub_profiles_protect_role before update on public.profiles for each row execute function public.hub_protect_profile_role();
drop trigger if exists hub_auth_user_profile on auth.users;
create trigger hub_auth_user_profile after insert on auth.users for each row execute function public.hub_create_profile_for_auth_user();

insert into public.profiles(id, role, display_name, grade_band, created_at, updated_at)
select u.id, 'personal', left(coalesce(nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''), nullif(split_part(u.email, '@', 1), ''), 'ユーザー'), 80), null, coalesce(u.created_at, now()), now()
from auth.users u
on conflict (id) do nothing;

drop trigger if exists hub_materials_updated_at on public.hub_materials;
create trigger hub_materials_updated_at before update on public.hub_materials for each row execute function public.hub_set_updated_at();
drop trigger if exists hub_characters_updated_at on public.hub_characters;
create trigger hub_characters_updated_at before update on public.hub_characters for each row execute function public.hub_set_updated_at();
drop trigger if exists hub_user_settings_updated_at on public.hub_user_settings;
create trigger hub_user_settings_updated_at before update on public.hub_user_settings for each row execute function public.hub_set_updated_at();
drop trigger if exists hub_classrooms_updated_at on public.hub_classrooms;
create trigger hub_classrooms_updated_at before update on public.hub_classrooms for each row execute function public.hub_set_updated_at();
drop trigger if exists hub_assignments_updated_at on public.hub_assignments;
create trigger hub_assignments_updated_at before update on public.hub_assignments for each row execute function public.hub_set_updated_at();
drop trigger if exists hub_submissions_updated_at on public.hub_assignment_submissions;
create trigger hub_submissions_updated_at before update on public.hub_assignment_submissions for each row execute function public.hub_set_updated_at();
drop trigger if exists hub_submissions_protect_update on public.hub_assignment_submissions;
create trigger hub_submissions_protect_update before update on public.hub_assignment_submissions for each row execute function public.hub_protect_submission_update();

create or replace function public.hub_current_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.hub_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.hub_teacher_has_student(p_student_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.hub_classroom_members cm
    join public.hub_classrooms c on c.id = cm.classroom_id
    where cm.student_id = p_student_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.hub_is_classroom_teacher(p_classroom_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.hub_classrooms where id = p_classroom_id and teacher_id = auth.uid());
$$;

create or replace function public.hub_is_classroom_member(p_classroom_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.hub_classroom_members where classroom_id = p_classroom_id and student_id = auth.uid());
$$;

create or replace function public.hub_student_can_access_version(p_version_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.hub_assignments a
    join public.hub_classroom_members cm on cm.classroom_id = a.classroom_id
    where a.material_version_id = p_version_id and a.published_at is not null and cm.student_id = auth.uid()
  );
$$;

create or replace function public.hub_can_read_storage_object(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.hub_is_admin() or exists(
    select 1 from public.hub_visual_assets va
    where va.storage_path = p_name
      and (va.owner_id = auth.uid() or (va.material_version_id is not null and public.hub_student_can_access_version(va.material_version_id)))
  );
$$;

create or replace function public.hub_save_material(p_document jsonb, p_material_id uuid default null) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_material_id uuid := coalesce(p_material_id, gen_random_uuid());
  v_version_id uuid := gen_random_uuid();
  v_next integer;
  v_title text := trim(p_document -> 'metadata' ->> 'title');
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if v_title is null or v_title = '' then raise exception 'material title is required'; end if;
  if p_material_id is null then
    insert into public.hub_materials(id, title, status, owner_id) values(v_material_id, v_title, 'published', v_user_id);
  elsif not exists(select 1 from public.hub_materials where id = v_material_id and owner_id = v_user_id) then
    raise exception 'material not found or forbidden';
  end if;
  select coalesce(max(version_number), 0) + 1 into v_next from public.hub_material_versions where material_id = v_material_id;
  insert into public.hub_material_versions(id, material_id, version_number, document_json) values(v_version_id, v_material_id, v_next, p_document);
  update public.hub_materials set title = v_title, current_version_id = v_version_id, status = 'published' where id = v_material_id;
  return v_material_id;
end;
$$;

create or replace function public.hub_join_classroom(p_join_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_classroom_id uuid;
begin
  if public.hub_current_role() <> 'student' then raise exception 'student role required'; end if;
  select id into v_classroom_id from public.hub_classrooms where join_code = upper(trim(p_join_code));
  if v_classroom_id is null then raise exception 'classroom not found'; end if;
  insert into public.hub_classroom_members(classroom_id, student_id) values(v_classroom_id, auth.uid()) on conflict do nothing;
  return v_classroom_id;
end;
$$;

create or replace function public.hub_finalize_attempt_exp(p_attempt_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_award integer := 0;
  v_inserted integer;
  v_question record;
begin
  if not exists(select 1 from public.hub_attempts where id = p_attempt_id and user_id = v_user_id and status = 'completed') then
    raise exception 'completed attempt not found';
  end if;
  insert into public.hub_activity_logs(user_id, event_type, dedupe_key, exp_awarded, reference_id)
  values(v_user_id, 'material_completed', 'material_completed:' || p_attempt_id::text, 20, p_attempt_id)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  v_award := v_award + v_inserted * 20;
  for v_question in select question_id from public.hub_answers where attempt_id = p_attempt_id and is_correct is true loop
    insert into public.hub_activity_logs(user_id, event_type, dedupe_key, exp_awarded, reference_id)
    values(v_user_id, 'correct_answer', 'correct_answer:' || p_attempt_id::text || ':' || v_question.question_id, 5, p_attempt_id)
    on conflict do nothing;
    get diagnostics v_inserted = row_count;
    v_award := v_award + v_inserted * 5;
  end loop;
  insert into public.hub_activity_logs(user_id, event_type, dedupe_key, exp_awarded, reference_id)
  values(v_user_id, 'daily_learning', 'daily_learning:' || current_date::text, 10, p_attempt_id)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  v_award := v_award + v_inserted * 10;
  if v_award > 0 then
    update public.hub_characters
      set exp = exp + v_award, level = floor((exp + v_award) / 100.0)::integer + 1
      where id = (select id from public.hub_characters where owner_id = v_user_id order by updated_at desc limit 1);
    update public.hub_attempts set exp_awarded = exp_awarded + v_award where id = p_attempt_id;
  end if;
  return v_award;
end;
$$;

create or replace function public.hub_apply_character_asset(p_character_asset_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_asset public.hub_character_assets%rowtype;
  v_exp integer;
  v_required integer;
begin
  select * into v_asset from public.hub_character_assets where id = p_character_asset_id and owner_id = auth.uid();
  if v_asset.id is null then raise exception 'character asset not found'; end if;
  select exp into v_exp from public.hub_characters where id = v_asset.character_id and owner_id = auth.uid();
  v_required := case v_asset.stage when 'egg' then 0 when 'child' then 100 when 'learning-partner' then 300 else 2147483647 end;
  if v_exp < v_required then raise exception 'not enough experience'; end if;
  update public.hub_character_assets set is_active = false where character_id = v_asset.character_id and is_active;
  update public.hub_character_assets set is_active = true where id = v_asset.id;
  update public.hub_characters c
    set stage = v_asset.stage,
        design_json = coalesce((select va.metadata_json -> 'design' from public.hub_visual_assets va where va.id = v_asset.visual_asset_id), c.design_json)
    where c.id = v_asset.character_id;
  insert into public.hub_activity_logs(user_id, event_type, dedupe_key, exp_awarded, reference_id)
    values(auth.uid(), 'character_evolved', 'character_evolved:' || v_asset.id::text, 0, v_asset.character_id) on conflict do nothing;
  return v_asset.stage;
end;
$$;

alter table public.profiles enable row level security;
alter table public.hub_user_settings enable row level security;
alter table public.hub_visual_assets enable row level security;
alter table public.hub_character_assets enable row level security;
alter table public.hub_activity_logs enable row level security;
alter table public.hub_classrooms enable row level security;
alter table public.hub_classroom_members enable row level security;
alter table public.hub_assignments enable row level security;
alter table public.hub_assignment_submissions enable row level security;
alter table public.hub_ai_generations enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.hub_is_admin() or public.hub_teacher_has_student(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists materials_select on public.hub_materials;
create policy materials_select on public.hub_materials for select to authenticated using (
  owner_id = auth.uid() or public.hub_is_admin() or exists (
    select 1 from public.hub_material_versions v where v.material_id = hub_materials.id and public.hub_student_can_access_version(v.id)
  )
);
drop policy if exists materials_insert on public.hub_materials;
create policy materials_insert on public.hub_materials for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists materials_update on public.hub_materials;
create policy materials_update on public.hub_materials for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists materials_delete on public.hub_materials;
create policy materials_delete on public.hub_materials for delete to authenticated using (owner_id = auth.uid());

drop policy if exists material_versions_select on public.hub_material_versions;
create policy material_versions_select on public.hub_material_versions for select to authenticated using (
  exists(select 1 from public.hub_materials m where m.id = material_id and m.owner_id = auth.uid())
  or public.hub_is_admin()
  or public.hub_student_can_access_version(hub_material_versions.id)
);
drop policy if exists material_versions_insert on public.hub_material_versions;
create policy material_versions_insert on public.hub_material_versions for insert to authenticated with check (exists(select 1 from public.hub_materials m where m.id = material_id and m.owner_id = auth.uid()));
drop policy if exists material_versions_update on public.hub_material_versions;
create policy material_versions_update on public.hub_material_versions for update to authenticated using (exists(select 1 from public.hub_materials m where m.id = material_id and m.owner_id = auth.uid()));

drop policy if exists attempts_select on public.hub_attempts;
create policy attempts_select on public.hub_attempts for select to authenticated using (
  user_id = auth.uid() or public.hub_is_admin() or exists(
    select 1 from public.hub_assignment_submissions s join public.hub_assignments a on a.id = s.assignment_id
    where s.attempt_id = hub_attempts.id and a.teacher_id = auth.uid()
  )
);
drop policy if exists attempts_insert on public.hub_attempts;
create policy attempts_insert on public.hub_attempts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists attempts_update on public.hub_attempts;
create policy attempts_update on public.hub_attempts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists answers_select on public.hub_answers;
create policy answers_select on public.hub_answers for select to authenticated using (
  exists(select 1 from public.hub_attempts at where at.id = attempt_id and at.user_id = auth.uid()) or public.hub_is_admin()
  or exists(select 1 from public.hub_assignment_submissions s join public.hub_assignments a on a.id = s.assignment_id where s.attempt_id = hub_answers.attempt_id and a.teacher_id = auth.uid())
);
drop policy if exists answers_insert on public.hub_answers;
create policy answers_insert on public.hub_answers for insert to authenticated with check (exists(select 1 from public.hub_attempts at where at.id = attempt_id and at.user_id = auth.uid()));
drop policy if exists answers_update on public.hub_answers;
create policy answers_update on public.hub_answers for update to authenticated using (exists(select 1 from public.hub_attempts at where at.id = attempt_id and at.user_id = auth.uid()));

drop policy if exists feedback_select on public.hub_feedback;
create policy feedback_select on public.hub_feedback for select to authenticated using (
  exists(select 1 from public.hub_attempts at where at.id = attempt_id and at.user_id = auth.uid()) or public.hub_is_admin()
  or exists(select 1 from public.hub_assignment_submissions s join public.hub_assignments a on a.id = s.assignment_id where s.attempt_id = hub_feedback.attempt_id and a.teacher_id = auth.uid())
);
drop policy if exists feedback_insert on public.hub_feedback;
create policy feedback_insert on public.hub_feedback for insert to authenticated with check (
  exists(select 1 from public.hub_attempts at where at.id = attempt_id and at.user_id = auth.uid())
  or (source = 'teacher' and exists(select 1 from public.hub_assignment_submissions s join public.hub_assignments a on a.id = s.assignment_id where s.attempt_id = hub_feedback.attempt_id and a.teacher_id = auth.uid()))
);

drop policy if exists characters_owner on public.hub_characters;
drop policy if exists characters_select on public.hub_characters;
create policy characters_select on public.hub_characters for select to authenticated using (owner_id = auth.uid() or public.hub_is_admin());
drop policy if exists characters_insert on public.hub_characters;
create policy characters_insert on public.hub_characters for insert to authenticated with check (owner_id = auth.uid() and stage = 'egg' and level = 1 and exp = 0);
drop policy if exists characters_update on public.hub_characters;
create policy characters_update on public.hub_characters for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists characters_delete on public.hub_characters;
create policy characters_delete on public.hub_characters for delete to authenticated using (owner_id = auth.uid());
drop policy if exists user_settings_owner on public.hub_user_settings;
create policy user_settings_owner on public.hub_user_settings for all to authenticated using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and (active_background_asset_id is null or exists(select 1 from public.hub_visual_assets va where va.id = active_background_asset_id and va.owner_id = auth.uid() and va.kind = 'app-background'))
);
drop policy if exists visual_assets_owner on public.hub_visual_assets;
drop policy if exists visual_assets_select on public.hub_visual_assets;
create policy visual_assets_select on public.hub_visual_assets for select to authenticated using (owner_id = auth.uid() or public.hub_is_admin() or (material_version_id is not null and public.hub_student_can_access_version(material_version_id)));
drop policy if exists visual_assets_insert on public.hub_visual_assets;
create policy visual_assets_insert on public.hub_visual_assets for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists visual_assets_update on public.hub_visual_assets;
create policy visual_assets_update on public.hub_visual_assets for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists visual_assets_delete on public.hub_visual_assets;
create policy visual_assets_delete on public.hub_visual_assets for delete to authenticated using (owner_id = auth.uid());
drop policy if exists character_assets_owner on public.hub_character_assets;
drop policy if exists character_assets_select on public.hub_character_assets;
create policy character_assets_select on public.hub_character_assets for select to authenticated using (owner_id = auth.uid() or public.hub_is_admin());
drop policy if exists character_assets_insert on public.hub_character_assets;
create policy character_assets_insert on public.hub_character_assets for insert to authenticated with check (
  owner_id = auth.uid()
  and exists(select 1 from public.hub_characters c where c.id = character_id and c.owner_id = auth.uid())
  and exists(select 1 from public.hub_visual_assets va where va.id = visual_asset_id and va.owner_id = auth.uid())
  and (is_active = false or stage = 'egg')
);
drop policy if exists character_assets_delete on public.hub_character_assets;
create policy character_assets_delete on public.hub_character_assets for delete to authenticated using (owner_id = auth.uid());
drop policy if exists activity_logs_select on public.hub_activity_logs;
create policy activity_logs_select on public.hub_activity_logs for select to authenticated using (user_id = auth.uid() or public.hub_is_admin());

drop policy if exists classrooms_select on public.hub_classrooms;
create policy classrooms_select on public.hub_classrooms for select to authenticated using (teacher_id = auth.uid() or public.hub_is_admin() or public.hub_is_classroom_member(id));
drop policy if exists classrooms_insert on public.hub_classrooms;
create policy classrooms_insert on public.hub_classrooms for insert to authenticated with check (teacher_id = auth.uid() and public.hub_current_role() = 'teacher');
drop policy if exists classrooms_update on public.hub_classrooms;
create policy classrooms_update on public.hub_classrooms for update to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
drop policy if exists classrooms_delete on public.hub_classrooms;
create policy classrooms_delete on public.hub_classrooms for delete to authenticated using (teacher_id = auth.uid());

drop policy if exists classroom_members_select on public.hub_classroom_members;
create policy classroom_members_select on public.hub_classroom_members for select to authenticated using (student_id = auth.uid() or public.hub_is_admin() or public.hub_is_classroom_teacher(classroom_id));
drop policy if exists classroom_members_delete on public.hub_classroom_members;
create policy classroom_members_delete on public.hub_classroom_members for delete to authenticated using (student_id = auth.uid() or public.hub_is_classroom_teacher(classroom_id));

drop policy if exists assignments_select on public.hub_assignments;
create policy assignments_select on public.hub_assignments for select to authenticated using (teacher_id = auth.uid() or public.hub_is_admin() or (published_at is not null and public.hub_is_classroom_member(classroom_id)));
drop policy if exists assignments_insert on public.hub_assignments;
create policy assignments_insert on public.hub_assignments for insert to authenticated with check (
  teacher_id = auth.uid()
  and public.hub_current_role() = 'teacher'
  and public.hub_is_classroom_teacher(classroom_id)
  and exists(select 1 from public.hub_material_versions v join public.hub_materials m on m.id = v.material_id where v.id = material_version_id and m.owner_id = auth.uid())
);
drop policy if exists assignments_update on public.hub_assignments;
create policy assignments_update on public.hub_assignments for update to authenticated using (teacher_id = auth.uid()) with check (
  teacher_id = auth.uid()
  and public.hub_is_classroom_teacher(classroom_id)
  and exists(select 1 from public.hub_material_versions v join public.hub_materials m on m.id = v.material_id where v.id = material_version_id and m.owner_id = auth.uid())
);
drop policy if exists assignments_delete on public.hub_assignments;
create policy assignments_delete on public.hub_assignments for delete to authenticated using (teacher_id = auth.uid());

drop policy if exists submissions_select on public.hub_assignment_submissions;
create policy submissions_select on public.hub_assignment_submissions for select to authenticated using (student_id = auth.uid() or public.hub_is_admin() or exists(select 1 from public.hub_assignments a where a.id = assignment_id and a.teacher_id = auth.uid()));
drop policy if exists submissions_insert on public.hub_assignment_submissions;
create policy submissions_insert on public.hub_assignment_submissions for insert to authenticated with check (
  student_id = auth.uid()
  and status in ('draft', 'submitted')
  and teacher_feedback is null and teacher_score is null and reviewed_at is null
  and exists(select 1 from public.hub_assignments a join public.hub_classroom_members cm on cm.classroom_id = a.classroom_id where a.id = assignment_id and a.published_at is not null and cm.student_id = auth.uid())
  and exists(select 1 from public.hub_attempts at where at.id = attempt_id and at.user_id = auth.uid() and at.status = 'completed')
);
drop policy if exists submissions_student_update on public.hub_assignment_submissions;
create policy submissions_student_update on public.hub_assignment_submissions for update to authenticated
  using (student_id = auth.uid() and status <> 'reviewed')
  with check (student_id = auth.uid() and status in ('draft', 'submitted') and teacher_feedback is null and teacher_score is null and reviewed_at is null and exists(select 1 from public.hub_attempts at where at.id = attempt_id and at.user_id = auth.uid() and at.status = 'completed'));
drop policy if exists submissions_teacher_update on public.hub_assignment_submissions;
create policy submissions_teacher_update on public.hub_assignment_submissions for update to authenticated using (exists(select 1 from public.hub_assignments a where a.id = assignment_id and a.teacher_id = auth.uid()));

drop policy if exists ai_generations_owner on public.hub_ai_generations;
create policy ai_generations_owner on public.hub_ai_generations for all to authenticated using (user_id = auth.uid() or public.hub_is_admin()) with check (user_id = auth.uid());

revoke all on table public.profiles, public.hub_user_settings, public.hub_visual_assets, public.hub_character_assets, public.hub_activity_logs, public.hub_classrooms, public.hub_classroom_members, public.hub_assignments, public.hub_assignment_submissions, public.hub_ai_generations from anon, authenticated;
grant select on public.profiles to authenticated;
grant update(display_name, grade_band, updated_at) on public.profiles to authenticated;
grant select, insert, update, delete on public.hub_materials, public.hub_material_versions, public.hub_attempts, public.hub_answers, public.hub_feedback, public.hub_characters, public.hub_user_settings, public.hub_visual_assets, public.hub_character_assets, public.hub_classrooms, public.hub_assignments, public.hub_assignment_submissions, public.hub_ai_generations to authenticated;
revoke update on public.hub_characters from authenticated;
grant update(name, updated_at) on public.hub_characters to authenticated;
revoke update on public.hub_character_assets from authenticated;
grant select, delete on public.hub_classroom_members to authenticated;
grant select on public.hub_activity_logs to authenticated;
grant all on table public.profiles, public.hub_user_settings, public.hub_visual_assets, public.hub_character_assets, public.hub_activity_logs, public.hub_classrooms, public.hub_classroom_members, public.hub_assignments, public.hub_assignment_submissions, public.hub_ai_generations to service_role;
revoke all on function public.hub_save_material(jsonb, uuid), public.hub_join_classroom(text), public.hub_finalize_attempt_exp(uuid), public.hub_apply_character_asset(uuid) from public, anon;
grant execute on function public.hub_save_material(jsonb, uuid), public.hub_join_classroom(text), public.hub_finalize_attempt_exp(uuid), public.hub_apply_character_asset(uuid) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('gakugaku-assets', 'gakugaku-assets', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists gakugaku_assets_select on storage.objects;
create policy gakugaku_assets_select on storage.objects for select to authenticated using (bucket_id = 'gakugaku-assets' and public.hub_can_read_storage_object(name));
drop policy if exists gakugaku_assets_insert on storage.objects;
create policy gakugaku_assets_insert on storage.objects for insert to authenticated with check (bucket_id = 'gakugaku-assets' and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists gakugaku_assets_update on storage.objects;
create policy gakugaku_assets_update on storage.objects for update to authenticated using (bucket_id = 'gakugaku-assets' and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text) with check (bucket_id = 'gakugaku-assets' and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text);
drop policy if exists gakugaku_assets_delete on storage.objects;
create policy gakugaku_assets_delete on storage.objects for delete to authenticated using (bucket_id = 'gakugaku-assets' and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text);

commit;

begin;

alter table public.hub_attempts
  add column if not exists feedback_status text not null default 'not-required';
alter table public.hub_attempts drop constraint if exists hub_attempts_feedback_status_check;
alter table public.hub_attempts add constraint hub_attempts_feedback_status_check
  check (feedback_status in ('not-required', 'pending', 'complete', 'failed'));

alter table public.hub_feedback
  add column if not exists feedback_json jsonb not null default '{}'::jsonb;

create table if not exists public.hub_answer_assets (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.hub_attempts(id) on delete cascade,
  question_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null default 'image/webp' check (mime_type in ('image/png', 'image/webp')),
  width integer not null check (width between 1 and 4096),
  height integer not null check (height between 1 and 4096),
  recognized_text text,
  recognition_confidence numeric check (recognition_confidence between 0 and 1),
  recognition_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);
create index if not exists hub_answer_assets_owner_idx on public.hub_answer_assets(owner_id, created_at desc);
create index if not exists hub_answer_assets_attempt_idx on public.hub_answer_assets(attempt_id, question_id);

drop trigger if exists hub_answer_assets_updated_at on public.hub_answer_assets;
create trigger hub_answer_assets_updated_at before update on public.hub_answer_assets
for each row execute function public.hub_set_updated_at();

alter table public.hub_ai_generations drop constraint if exists hub_ai_generations_feature_check;
alter table public.hub_ai_generations add constraint hub_ai_generations_feature_check
  check (feature in ('material', 'material-image', 'evaluation', 'attempt-feedback', 'handwriting-recognition', 'character-design', 'character-image', 'background'));

create or replace function public.hub_owns_material(p_material_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.hub_materials m where m.id = p_material_id and m.owner_id = auth.uid());
$$;

create or replace function public.hub_student_can_access_material(p_material_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1
    from public.hub_material_versions v
    join public.hub_assignments a on a.material_version_id = v.id and a.published_at is not null
    join public.hub_classroom_members cm on cm.classroom_id = a.classroom_id
    where v.material_id = p_material_id and cm.student_id = auth.uid()
  );
$$;

create or replace function public.hub_owns_attempt(p_attempt_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.hub_attempts a where a.id = p_attempt_id and a.user_id = auth.uid());
$$;

create or replace function public.hub_can_access_attempt(p_attempt_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.hub_owns_attempt(p_attempt_id)
    or public.hub_is_admin()
    or exists(
      select 1
      from public.hub_assignment_submissions s
      join public.hub_assignments a on a.id = s.assignment_id
      where s.attempt_id = p_attempt_id and a.teacher_id = auth.uid()
    );
$$;

-- Break the hub_materials <-> hub_material_versions policy recursion.
drop policy if exists materials_select on public.hub_materials;
create policy materials_select on public.hub_materials for select to authenticated using (
  owner_id = auth.uid() or public.hub_is_admin() or public.hub_student_can_access_material(id)
);
drop policy if exists material_versions_select on public.hub_material_versions;
create policy material_versions_select on public.hub_material_versions for select to authenticated using (
  public.hub_owns_material(material_id) or public.hub_is_admin() or public.hub_student_can_access_version(id)
);
drop policy if exists material_versions_insert on public.hub_material_versions;
create policy material_versions_insert on public.hub_material_versions for insert to authenticated
with check (public.hub_owns_material(material_id));
drop policy if exists material_versions_update on public.hub_material_versions;
create policy material_versions_update on public.hub_material_versions for update to authenticated
using (public.hub_owns_material(material_id)) with check (public.hub_owns_material(material_id));

drop policy if exists answers_select on public.hub_answers;
create policy answers_select on public.hub_answers for select to authenticated using (public.hub_can_access_attempt(attempt_id));
drop policy if exists answers_insert on public.hub_answers;
create policy answers_insert on public.hub_answers for insert to authenticated with check (public.hub_owns_attempt(attempt_id));
drop policy if exists answers_update on public.hub_answers;
create policy answers_update on public.hub_answers for update to authenticated using (public.hub_owns_attempt(attempt_id)) with check (public.hub_owns_attempt(attempt_id));
drop policy if exists answers_delete on public.hub_answers;
create policy answers_delete on public.hub_answers for delete to authenticated using (public.hub_owns_attempt(attempt_id));

drop policy if exists feedback_select on public.hub_feedback;
create policy feedback_select on public.hub_feedback for select to authenticated using (public.hub_can_access_attempt(attempt_id));
drop policy if exists feedback_insert on public.hub_feedback;
create policy feedback_insert on public.hub_feedback for insert to authenticated with check (
  public.hub_owns_attempt(attempt_id)
  or (source = 'teacher' and exists(
    select 1 from public.hub_assignment_submissions s
    join public.hub_assignments a on a.id = s.assignment_id
    where s.attempt_id = hub_feedback.attempt_id and a.teacher_id = auth.uid()
  ))
);
drop policy if exists feedback_update on public.hub_feedback;
create policy feedback_update on public.hub_feedback for update to authenticated using (public.hub_owns_attempt(attempt_id)) with check (public.hub_owns_attempt(attempt_id));
drop policy if exists feedback_delete on public.hub_feedback;
create policy feedback_delete on public.hub_feedback for delete to authenticated using (public.hub_owns_attempt(attempt_id));

alter table public.hub_answer_assets enable row level security;
drop policy if exists answer_assets_select on public.hub_answer_assets;
create policy answer_assets_select on public.hub_answer_assets for select to authenticated using (public.hub_can_access_attempt(attempt_id));
drop policy if exists answer_assets_insert on public.hub_answer_assets;
create policy answer_assets_insert on public.hub_answer_assets for insert to authenticated with check (owner_id = auth.uid() and public.hub_owns_attempt(attempt_id));
drop policy if exists answer_assets_update on public.hub_answer_assets;
create policy answer_assets_update on public.hub_answer_assets for update to authenticated using (owner_id = auth.uid() and public.hub_owns_attempt(attempt_id)) with check (owner_id = auth.uid() and public.hub_owns_attempt(attempt_id));
drop policy if exists answer_assets_delete on public.hub_answer_assets;
create policy answer_assets_delete on public.hub_answer_assets for delete to authenticated using (owner_id = auth.uid() and public.hub_owns_attempt(attempt_id));

create or replace function public.hub_can_read_storage_object(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.hub_is_admin()
    or exists(
      select 1 from public.hub_visual_assets va
      where va.storage_path = p_name
        and (va.owner_id = auth.uid() or (va.material_version_id is not null and public.hub_student_can_access_version(va.material_version_id)))
    )
    or exists(
      select 1 from public.hub_answer_assets aa
      where aa.storage_path = p_name and public.hub_can_access_attempt(aa.attempt_id)
    );
$$;

revoke all on table public.hub_answer_assets from anon, authenticated;
grant select, insert, update, delete on public.hub_answer_assets to authenticated;
grant all on public.hub_answer_assets to service_role;

revoke all on function public.hub_owns_material(uuid), public.hub_student_can_access_material(uuid), public.hub_owns_attempt(uuid), public.hub_can_access_attempt(uuid) from public, anon;
grant execute on function public.hub_owns_material(uuid), public.hub_student_can_access_material(uuid), public.hub_owns_attempt(uuid), public.hub_can_access_attempt(uuid) to authenticated;

commit;

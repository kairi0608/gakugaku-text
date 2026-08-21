begin;

-- Material review lifecycle. Existing published/archived rows remain valid.
alter table public.hub_materials drop constraint if exists hub_materials_status_check;
alter table public.hub_materials add constraint hub_materials_status_check
  check (status in ('draft', 'reviewing', 'approved', 'published', 'archived'));

alter table public.hub_visual_assets drop constraint if exists hub_visual_assets_kind_check;
alter table public.hub_visual_assets add constraint hub_visual_assets_kind_check
  check (kind in ('material-background', 'material-scene', 'avatar', 'egg', 'child', 'learning-partner', 'app-background', 'photo'));
alter table public.hub_visual_assets add column if not exists asset_source text;
alter table public.hub_visual_assets add column if not exists asset_kind text;
update public.hub_visual_assets set
  asset_source = coalesce(asset_source, case when generation_type = 'ai' then 'ai-generated' else 'upload' end),
  asset_kind = coalesce(asset_kind, case when kind = 'material-background' then 'background' when kind in ('avatar','egg','child','learning-partner') then 'character' else 'illustration' end);
alter table public.hub_visual_assets alter column asset_source set default 'system';
alter table public.hub_visual_assets alter column asset_source set not null;
alter table public.hub_visual_assets alter column asset_kind set default 'illustration';
alter table public.hub_visual_assets alter column asset_kind set not null;
alter table public.hub_visual_assets drop constraint if exists hub_visual_assets_asset_source_check;
alter table public.hub_visual_assets add constraint hub_visual_assets_asset_source_check check (asset_source in ('upload','ai-generated','system'));
alter table public.hub_visual_assets drop constraint if exists hub_visual_assets_asset_kind_check;
alter table public.hub_visual_assets add constraint hub_visual_assets_asset_kind_check check (asset_kind in ('photo','illustration','background','character','diagram'));

alter table public.hub_user_settings add column if not exists presentation_family text not null default 'illustration';
alter table public.hub_user_settings add column if not exists interest_category text not null default 'adventure';
alter table public.hub_user_settings add column if not exists timezone text not null default 'Asia/Tokyo';
alter table public.hub_user_settings drop constraint if exists hub_user_settings_presentation_family_check;
alter table public.hub_user_settings add constraint hub_user_settings_presentation_family_check check (presentation_family in ('real','illustration'));
alter table public.hub_user_settings drop constraint if exists hub_user_settings_interest_category_check;
alter table public.hub_user_settings add constraint hub_user_settings_interest_category_check check (interest_category in ('animals','space','sports','vehicles','nature','adventure'));

create table if not exists public.hub_daily_moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  timezone text not null default 'Asia/Tokyo',
  mood text not null check (mood in ('very-good','good','neutral','tired','low')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, local_date)
);

create table if not exists public.hub_learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_version_id uuid references public.hub_material_versions(id) on delete restrict,
  assignment_id uuid references public.hub_assignments(id) on delete set null,
  attempt_id uuid references public.hub_attempts(id) on delete set null,
  mode text not null check (mode in ('assigned','self-practice','what-if')),
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  target_question_count integer not null check (target_question_count between 1 and 30),
  completed_question_count integer not null default 0 check (completed_question_count >= 0),
  correct_question_count integer not null default 0 check (correct_question_count >= 0),
  feedback_mode text not null default 'after-set' check (feedback_mode in ('after-set','after-each')),
  presentation_family text not null default 'illustration' check (presentation_family in ('real','illustration')),
  interest_category text not null default 'adventure' check (interest_category in ('animals','space','sports','vehicles','nature','adventure')),
  material_theme text,
  mood text check (mood is null or mood in ('very-good','good','neutral','tired','low')),
  subject text,
  unit text,
  difficulty text not null default 'standard' check (difficulty in ('easy','standard','challenge')),
  score numeric check (score between 0 and 100),
  feedback_json jsonb not null default '{}'::jsonb,
  feedback_status text not null default 'not-required' check (feedback_status in ('not-required','pending','complete','failed')),
  last_activity_at timestamptz not null default now(),
  active_seconds integer not null default 0 check (active_seconds >= 0),
  exp_awarded integer not null default 0 check (exp_awarded >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.hub_session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.hub_learning_sessions(id) on delete cascade,
  order_number integer not null check (order_number > 0),
  question_json jsonb not null,
  answer_json jsonb,
  is_correct boolean,
  generated_from_question_id uuid references public.hub_session_questions(id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  unique(session_id, order_number)
);

create table if not exists public.hub_material_reviews (
  id uuid primary key default gen_random_uuid(),
  material_version_id uuid not null references public.hub_material_versions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  decision text not null check (decision in ('approved','rejected','needs_revision')),
  comment text check (char_length(comment) <= 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.hub_special_events (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.hub_classrooms(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  start_at timestamptz not null,
  end_at timestamptz,
  trigger_type text not null check (trigger_type in ('schedule','login-streak','study-time','completed-problems')),
  trigger_config jsonb not null default '{}'::jsonb,
  source text not null check (source in ('ai','teacher')),
  what_if_json jsonb not null,
  presentation_family text not null default 'illustration' check (presentation_family in ('real','illustration')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or end_at > start_at)
);

create table if not exists public.hub_what_if_participations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.hub_special_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer_text text not null check (char_length(answer_text) between 1 and 5000),
  feedback_json jsonb not null default '{}'::jsonb,
  exp_awarded integer not null default 0 check (exp_awarded >= 0),
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create index if not exists hub_daily_moods_user_idx on public.hub_daily_moods(user_id, local_date desc);
create index if not exists hub_learning_sessions_user_idx on public.hub_learning_sessions(user_id, started_at desc);
create index if not exists hub_learning_sessions_assignment_idx on public.hub_learning_sessions(assignment_id, user_id);
create index if not exists hub_session_questions_session_idx on public.hub_session_questions(session_id, order_number);
create index if not exists hub_material_reviews_version_idx on public.hub_material_reviews(material_version_id, created_at desc);
create index if not exists hub_special_events_classroom_idx on public.hub_special_events(classroom_id, start_at desc);

drop trigger if exists hub_daily_moods_updated_at on public.hub_daily_moods;
create trigger hub_daily_moods_updated_at before update on public.hub_daily_moods for each row execute function public.hub_set_updated_at();
drop trigger if exists hub_special_events_updated_at on public.hub_special_events;
create trigger hub_special_events_updated_at before update on public.hub_special_events for each row execute function public.hub_set_updated_at();

alter table public.hub_activity_logs drop constraint if exists hub_activity_logs_event_type_check;
alter table public.hub_activity_logs add constraint hub_activity_logs_event_type_check
  check (event_type in ('material_completed','correct_answer','daily_learning','character_evolved','daily_login','session_completed','what_if_participation'));
alter table public.hub_ai_generations drop constraint if exists hub_ai_generations_feature_check;
alter table public.hub_ai_generations add constraint hub_ai_generations_feature_check
  check (feature in ('material','material-image','evaluation','attempt-feedback','handwriting-recognition','character-design','character-image','background','adaptive-question','set-feedback','what-if'));

create or replace function public.hub_teacher_can_view_student(p_student_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.hub_classroom_members cm
    join public.hub_classrooms c on c.id = cm.classroom_id
    where cm.student_id = p_student_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.hub_can_access_learning_session(p_session_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.hub_learning_sessions s
    where s.id = p_session_id and (s.user_id = auth.uid() or public.hub_is_admin() or public.hub_teacher_can_view_student(s.user_id))
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
  v_status text := case when public.hub_current_role() in ('teacher','admin') then 'draft' else 'published' end;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if v_title is null or v_title = '' then raise exception 'material title is required'; end if;
  if p_material_id is null then
    insert into public.hub_materials(id, title, status, owner_id) values(v_material_id, v_title, v_status, v_user_id);
  elsif not exists(select 1 from public.hub_materials where id = v_material_id and owner_id = v_user_id) then
    raise exception 'material not found or forbidden';
  end if;
  select coalesce(max(version_number), 0) + 1 into v_next from public.hub_material_versions where material_id = v_material_id;
  insert into public.hub_material_versions(id, material_id, version_number, document_json) values(v_version_id, v_material_id, v_next, p_document);
  update public.hub_materials set title = v_title, current_version_id = v_version_id, status = v_status where id = v_material_id;
  return v_material_id;
end;
$$;

create or replace function public.hub_require_approved_assignment_material() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_material_id uuid; v_status text; v_owner uuid; v_current uuid;
begin
  select m.id, m.status, m.owner_id, m.current_version_id into v_material_id, v_status, v_owner, v_current
  from public.hub_material_versions v join public.hub_materials m on m.id = v.material_id
  where v.id = new.material_version_id;
  if v_material_id is null or v_current <> new.material_version_id or (v_owner <> new.teacher_id and not public.hub_is_admin()) or v_status not in ('approved','published') then
    raise exception 'approved material version required';
  end if;
  if new.published_at is not null then update public.hub_materials set status = 'published' where id = v_material_id; end if;
  return new;
end;
$$;
drop trigger if exists hub_assignments_require_approved_material on public.hub_assignments;
create trigger hub_assignments_require_approved_material before insert or update of material_version_id, published_at on public.hub_assignments
for each row execute function public.hub_require_approved_assignment_material();

create or replace function public.hub_record_daily_login() returns integer
language plpgsql security definer set search_path = '' as $$
declare v_inserted integer;
begin
  insert into public.hub_activity_logs(user_id,event_type,dedupe_key,exp_awarded)
  values(auth.uid(),'daily_login','daily_login:' || timezone('Asia/Tokyo',now())::date::text,0)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.hub_current_login_streak() returns integer
language plpgsql stable security definer set search_path = '' as $$
declare v_day date := timezone('Asia/Tokyo',now())::date; v_count integer := 0;
begin
  loop
    exit when not exists(select 1 from public.hub_activity_logs where user_id = auth.uid() and dedupe_key = 'daily_login:' || v_day::text);
    v_count := v_count + 1; v_day := v_day - 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.hub_finalize_learning_session(p_session_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_award integer := 0; v_inserted integer;
begin
  if not exists(select 1 from public.hub_learning_sessions where id=p_session_id and user_id=auth.uid() and status='completed') then raise exception 'completed session not found'; end if;
  insert into public.hub_activity_logs(user_id,event_type,dedupe_key,exp_awarded,reference_id)
  values(auth.uid(),'session_completed','session_completed:' || p_session_id::text,20,p_session_id) on conflict do nothing;
  get diagnostics v_inserted = row_count; v_award := v_inserted * 20;
  if v_award > 0 then
    update public.hub_characters set exp=exp+v_award, level=floor((exp+v_award)/100.0)::integer+1
      where id=(select id from public.hub_characters where owner_id=auth.uid() order by updated_at desc limit 1);
    update public.hub_learning_sessions set exp_awarded=exp_awarded+v_award where id=p_session_id;
  end if;
  return v_award;
end;
$$;

create or replace function public.hub_add_session_active_seconds(p_session_id uuid, p_seconds integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_added integer := greatest(0, least(coalesce(p_seconds,0),300));
begin
  update public.hub_learning_sessions set active_seconds=active_seconds+v_added
  where id=p_session_id and user_id=auth.uid() and status='active';
  if not found then raise exception 'active session not found'; end if;
  return v_added;
end;
$$;

create or replace function public.hub_record_session_answer(p_session_id uuid, p_question_id uuid, p_answer jsonb, p_is_correct boolean, p_active_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_completed integer; v_target integer; v_correct integer; v_added integer := greatest(0,least(coalesce(p_active_seconds,0),300));
begin
  select completed_question_count,target_question_count,correct_question_count into v_completed,v_target,v_correct
  from public.hub_learning_sessions where id=p_session_id and user_id=auth.uid() and status='active' for update;
  if not found then raise exception 'active session not found'; end if;
  update public.hub_session_questions set answer_json=p_answer,is_correct=p_is_correct,answered_at=now()
  where id=p_question_id and session_id=p_session_id and order_number=v_completed+1 and answered_at is null;
  if not found then raise exception 'question order mismatch or already answered'; end if;
  v_completed := v_completed + 1;
  update public.hub_learning_sessions set completed_question_count=v_completed,
    correct_question_count=v_correct+case when p_is_correct is true then 1 else 0 end,
    active_seconds=active_seconds+v_added,last_activity_at=now()
  where id=p_session_id;
  return v_completed >= v_target;
end;
$$;

create or replace function public.hub_finalize_what_if(p_event_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_award integer := 0; v_inserted integer;
begin
  if not exists(select 1 from public.hub_what_if_participations where event_id=p_event_id and user_id=auth.uid()) then raise exception 'participation not found'; end if;
  insert into public.hub_activity_logs(user_id,event_type,dedupe_key,exp_awarded,reference_id)
  values(auth.uid(),'what_if_participation','what-if:event:' || p_event_id::text || ':user:' || auth.uid()::text,8,p_event_id) on conflict do nothing;
  get diagnostics v_inserted = row_count; v_award := v_inserted * 8;
  if v_award > 0 then
    update public.hub_characters set exp=exp+v_award, level=floor((exp+v_award)/100.0)::integer+1
      where id=(select id from public.hub_characters where owner_id=auth.uid() order by updated_at desc limit 1);
    update public.hub_what_if_participations set exp_awarded=v_award where event_id=p_event_id and user_id=auth.uid();
  end if;
  return v_award;
end;
$$;

alter table public.hub_daily_moods enable row level security;
alter table public.hub_learning_sessions enable row level security;
alter table public.hub_session_questions enable row level security;
alter table public.hub_material_reviews enable row level security;
alter table public.hub_special_events enable row level security;
alter table public.hub_what_if_participations enable row level security;

create policy daily_moods_select on public.hub_daily_moods for select to authenticated using (user_id=auth.uid() or public.hub_is_admin() or public.hub_teacher_can_view_student(user_id));
create policy daily_moods_insert on public.hub_daily_moods for insert to authenticated with check (user_id=auth.uid());
create policy daily_moods_update on public.hub_daily_moods for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists user_settings_teacher_select on public.hub_user_settings;
create policy user_settings_teacher_select on public.hub_user_settings for select to authenticated using (public.hub_is_admin() or public.hub_teacher_can_view_student(user_id));
create policy sessions_select on public.hub_learning_sessions for select to authenticated using (public.hub_can_access_learning_session(id));
create policy sessions_insert on public.hub_learning_sessions for insert to authenticated with check (user_id=auth.uid());
create policy sessions_update on public.hub_learning_sessions for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy session_questions_select on public.hub_session_questions for select to authenticated using (public.hub_can_access_learning_session(session_id));
create policy session_questions_insert on public.hub_session_questions for insert to authenticated with check (exists(select 1 from public.hub_learning_sessions s where s.id=session_id and s.user_id=auth.uid()));
create policy session_questions_update on public.hub_session_questions for update to authenticated using (exists(select 1 from public.hub_learning_sessions s where s.id=session_id and s.user_id=auth.uid())) with check (exists(select 1 from public.hub_learning_sessions s where s.id=session_id and s.user_id=auth.uid()));
create policy material_reviews_select on public.hub_material_reviews for select to authenticated using (public.hub_is_admin() or exists(select 1 from public.hub_material_versions v join public.hub_materials m on m.id=v.material_id where v.id=material_version_id and m.owner_id=auth.uid()));
create policy material_reviews_insert on public.hub_material_reviews for insert to authenticated with check (reviewer_id=auth.uid() and (public.hub_is_admin() or exists(select 1 from public.hub_material_versions v join public.hub_materials m on m.id=v.material_id where v.id=material_version_id and m.owner_id=auth.uid())));
create policy special_events_select on public.hub_special_events for select to authenticated using (teacher_id=auth.uid() or public.hub_is_admin() or (enabled and public.hub_is_classroom_member(classroom_id)));
create policy special_events_insert on public.hub_special_events for insert to authenticated with check (teacher_id=auth.uid() and (public.hub_is_admin() or exists(select 1 from public.hub_classrooms c where c.id=classroom_id and c.teacher_id=auth.uid())));
create policy special_events_update on public.hub_special_events for update to authenticated using (teacher_id=auth.uid() or public.hub_is_admin()) with check (teacher_id=auth.uid() or public.hub_is_admin());
create policy what_if_participations_select on public.hub_what_if_participations for select to authenticated using (user_id=auth.uid() or public.hub_is_admin() or public.hub_teacher_can_view_student(user_id));
create policy what_if_participations_insert on public.hub_what_if_participations for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.hub_special_events e where e.id=event_id and public.hub_is_classroom_member(e.classroom_id)));

-- Admins can use the normal teacher workflow as well as admin-only pages.
drop policy if exists classrooms_insert on public.hub_classrooms;
create policy classrooms_insert on public.hub_classrooms for insert to authenticated with check (teacher_id=auth.uid() and public.hub_current_role() in ('teacher','admin'));
drop policy if exists classrooms_update on public.hub_classrooms;
create policy classrooms_update on public.hub_classrooms for update to authenticated using (teacher_id=auth.uid() or public.hub_is_admin()) with check (teacher_id=auth.uid() or public.hub_is_admin());
drop policy if exists classrooms_delete on public.hub_classrooms;
create policy classrooms_delete on public.hub_classrooms for delete to authenticated using (teacher_id=auth.uid() or public.hub_is_admin());
drop policy if exists classroom_members_delete on public.hub_classroom_members;
create policy classroom_members_delete on public.hub_classroom_members for delete to authenticated using (student_id=auth.uid() or public.hub_is_classroom_teacher(classroom_id) or public.hub_is_admin());
drop policy if exists assignments_insert on public.hub_assignments;
create policy assignments_insert on public.hub_assignments for insert to authenticated with check (
  teacher_id=auth.uid() and public.hub_current_role() in ('teacher','admin') and
  (public.hub_is_admin() or (public.hub_is_classroom_teacher(classroom_id) and exists(select 1 from public.hub_material_versions v join public.hub_materials m on m.id=v.material_id where v.id=material_version_id and m.owner_id=auth.uid())))
);
drop policy if exists assignments_update on public.hub_assignments;
create policy assignments_update on public.hub_assignments for update to authenticated using (teacher_id=auth.uid() or public.hub_is_admin()) with check (
  (teacher_id=auth.uid() or public.hub_is_admin()) and (public.hub_is_admin() or (public.hub_is_classroom_teacher(classroom_id) and exists(select 1 from public.hub_material_versions v join public.hub_materials m on m.id=v.material_id where v.id=material_version_id and m.owner_id=auth.uid())))
);
drop policy if exists assignments_delete on public.hub_assignments;
create policy assignments_delete on public.hub_assignments for delete to authenticated using (teacher_id=auth.uid() or public.hub_is_admin());
drop policy if exists submissions_teacher_update on public.hub_assignment_submissions;
create policy submissions_teacher_update on public.hub_assignment_submissions for update to authenticated using (public.hub_is_admin() or exists(select 1 from public.hub_assignments a where a.id=assignment_id and a.teacher_id=auth.uid()));

revoke all on table public.hub_daily_moods, public.hub_learning_sessions, public.hub_session_questions, public.hub_material_reviews, public.hub_special_events, public.hub_what_if_participations from anon, authenticated;
grant select, insert, update on public.hub_daily_moods, public.hub_learning_sessions, public.hub_session_questions to authenticated;
grant select, insert on public.hub_material_reviews, public.hub_what_if_participations to authenticated;
grant select, insert, update on public.hub_special_events to authenticated;
grant all on table public.hub_daily_moods, public.hub_learning_sessions, public.hub_session_questions, public.hub_material_reviews, public.hub_special_events, public.hub_what_if_participations to service_role;

revoke all on function public.hub_teacher_can_view_student(uuid), public.hub_can_access_learning_session(uuid), public.hub_record_daily_login(), public.hub_current_login_streak(), public.hub_finalize_learning_session(uuid), public.hub_add_session_active_seconds(uuid,integer), public.hub_record_session_answer(uuid,uuid,jsonb,boolean,integer), public.hub_finalize_what_if(uuid) from public, anon;
grant execute on function public.hub_teacher_can_view_student(uuid), public.hub_can_access_learning_session(uuid), public.hub_record_daily_login(), public.hub_current_login_streak(), public.hub_finalize_learning_session(uuid), public.hub_add_session_active_seconds(uuid,integer), public.hub_record_session_answer(uuid,uuid,jsonb,boolean,integer), public.hub_finalize_what_if(uuid) to authenticated;

commit;

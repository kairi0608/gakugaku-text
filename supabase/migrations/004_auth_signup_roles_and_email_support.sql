begin;

-- Public signup accepts personal, student, and teacher. Admin is deliberately
-- excluded and any unexpected metadata safely falls back to personal.
create or replace function public.hub_create_profile_for_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'requested_role';
  safe_role text;
  safe_grade text := new.raw_user_meta_data ->> 'grade_band';
  safe_name text := trim(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'ユーザー'));
begin
  safe_role := case when requested_role in ('personal', 'student', 'teacher') then requested_role else 'personal' end;
  if safe_role <> 'student' or safe_grade not in ('elementary', 'middle', 'high', 'other') then safe_grade := null; end if;
  insert into public.profiles(id, role, display_name, grade_band)
  values(new.id, safe_role, left(coalesce(nullif(safe_name, ''), 'ユーザー'), 80), safe_grade)
  on conflict (id) do nothing;
  return new;
end;
$$;

commit;


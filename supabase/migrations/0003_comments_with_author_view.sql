-- Mirrors posts_with_author: hides the real author on anonymous comments
-- from everyone except the author themself and admins.
create view public.comments_with_author
with (security_invoker = true)
as
select
  c.*,
  case
    when c.is_anonymous and auth.uid() <> c.author_id and not public.is_admin()
      then null
    else pr.display_name
  end as author_display_name,
  case
    when c.is_anonymous and auth.uid() <> c.author_id and not public.is_admin()
      then null
    else pr.avatar_url
  end as author_avatar_url
from public.comments c
join public.profiles pr on pr.id = c.author_id;


REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_if_cycle_elapsed(uuid) FROM PUBLIC, anon, authenticated;

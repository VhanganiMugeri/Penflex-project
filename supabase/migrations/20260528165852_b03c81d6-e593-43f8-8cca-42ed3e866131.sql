
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_ticket_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

DROP POLICY "Authenticated insert history" ON public.ticket_history;
CREATE POLICY "Insert history on visible tickets" ON public.ticket_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id
    AND (t.worker_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

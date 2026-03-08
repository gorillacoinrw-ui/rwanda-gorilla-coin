CREATE POLICY "Users can retry rejected completions"
ON public.user_task_completions
FOR UPDATE
USING (auth.uid() = user_id AND status = 'rejected')
WITH CHECK (auth.uid() = user_id AND status = 'pending');
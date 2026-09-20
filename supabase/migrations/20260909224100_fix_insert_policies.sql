-- Allow any authenticated user to create a household
create policy "Authenticated users can create households"
  on households for insert with check (auth.uid() is not null);

-- Allow users to add themselves as the first member (owner) of a household
create policy "Users can add themselves to households"
  on household_members for insert with check (profile_id = auth.uid());


-- Enable RLS on organisations table if not already enabled
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view organizations they own
CREATE POLICY "Users can view their own organizations" 
  ON public.organisations 
  FOR SELECT 
  USING (auth.uid() = owner_id);

-- Create policy to allow users to create organizations
CREATE POLICY "Users can create organizations" 
  ON public.organisations 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- Create policy to allow users to update their own organizations
CREATE POLICY "Users can update their own organizations" 
  ON public.organisations 
  FOR UPDATE 
  USING (auth.uid() = owner_id);

-- Create policy to allow users to delete their own organizations
CREATE POLICY "Users can delete their own organizations" 
  ON public.organisations 
  FOR DELETE 
  USING (auth.uid() = owner_id);

-- Also ensure RLS is enabled on memberships table and create policies
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view memberships for organizations they belong to
CREATE POLICY "Users can view their memberships" 
  ON public.memberships 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow organization creation to insert membership
CREATE POLICY "Allow membership creation" 
  ON public.memberships 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

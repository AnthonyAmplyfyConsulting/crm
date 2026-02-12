-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- 1. Profiles Table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  position text,
  phone text,
  role text default 'User', -- 'Admin' or 'User'
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Leads Table
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  description text,
  status text default 'Cold' check (status in ('Hot', 'Warm', 'Cold')),
  assigned_to uuid references public.profiles(id)
);

-- 3. Expenses Table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  description text not null,
  amount numeric(10, 2) not null,
  date date default CURRENT_DATE,
  receipt_url text,
  status text default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  submitted_by uuid references public.profiles(id)
);

-- 4. Calendar Events Table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  date timestamp with time zone not null, -- Stores both date and time
  type text check (type in ('Meeting', 'Task', 'Call')),
  assignee uuid references public.profiles(id),
  created_by uuid references public.profiles(id)
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.expenses enable row level security;
alter table public.events enable row level security;

-- RLS Policies (Simplified for initial setup)

-- PROFILES
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- LEADS
create policy "Leads viewable by authenticated users" on public.leads
  for select using (auth.role() = 'authenticated');

create policy "Leads insertable by authenticated users" on public.leads
  for insert with check (auth.role() = 'authenticated');

-- EXPENSES
create policy "Expenses viewable by all users" on public.expenses
  for select using (auth.role() = 'authenticated');

create policy "Expenses insertable by authenticated users" on public.expenses
  for insert with check (auth.role() = 'authenticated');

-- EVENTS
create policy "Events viewable by all users" on public.events
  for select using (auth.role() = 'authenticated');

create policy "Events insertable by authenticated users" on public.events
  for insert with check (auth.role() = 'authenticated');

-- Triggers to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'User');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

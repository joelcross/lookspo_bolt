begin;


-- Enable UUID extension
create extension if not exists "pgcrypto";


-- Table: profiles
create table profiles (
id uuid primary key default gen_random_uuid(),
username text not null unique,
name text not null,
bio text default '' not null,
avatar_url text null,
created_at timestamp with time zone default now() not null
);


-- Table: posts
create table posts (
id uuid primary key default gen_random_uuid(),
image_url text not null,
caption text default '' not null,
user_id uuid not null references profiles(id) on delete cascade,
created_at timestamp with time zone default now() not null
);


-- Table: collections
create table collections (
id uuid primary key default gen_random_uuid(),
name text not null,
user_id uuid not null references profiles(id) on delete cascade,
created_at timestamp with time zone default now() not null
);


-- Table: follows
create table follows (
id uuid primary key default gen_random_uuid(),
follower_id uuid not null references profiles(id) on delete cascade,
following_id uuid not null references profiles(id) on delete cascade,
created_at timestamp with time zone default now() not null,
unique(follower_id, following_id)
);


-- Table: likes
create table likes (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references profiles(id) on delete cascade,
post_id uuid not null references posts(id) on delete cascade,
created_at timestamp with time zone default now() not null,
unique(user_id, post_id)
);


-- Table: saves
create table saves (
id uuid primary key default gen_random_uuid(),
user_id uuid not null references profiles(id) on delete cascade,
post_id uuid not null references posts(id) on delete cascade,
collection_id uuid not null references collections(id) on delete cascade,
created_at timestamp with time zone default now() not null,
unique(user_id, post_id, collection_id)
);


-- Table: activities
create table activities (
id uuid primary key default gen_random_uuid(),
actor_id uuid not null references profiles(id) on delete cascade,
target_user_id uuid not null references profiles(id) on delete cascade,
type text check (type in ('like', 'save', 'follow')) not null,
post_id uuid null references posts(id) on delete set null,
created_at timestamp with time zone default now() not null
);


commit;


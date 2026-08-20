import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://msszquruzuentbdrxkxa.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zc3pxdXJ1enVlbnRiZHJ4a3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjY4NDcsImV4cCI6MjA5NDkwMjg0N30.bXm4NB45iDQ9Re62_go3TPepFuegFwVVd7gU0VQiNO4';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

// Safe fetch wrapper that handles iframe environments without assigning to window.fetch
const safeFetch: typeof fetch = (input, init) => {
  if (typeof window !== 'undefined' && window.fetch) {
    return window.fetch(input, init);
  }
  return fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: safeFetch,
  },
});

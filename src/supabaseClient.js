import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sbrkdglppgjikxpqtddz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicmtkZ2xwcGdqaWt4cHF0ZGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTY2MjYsImV4cCI6MjA4ODUzMjYyNn0.gXUWbi6Ms8nPia0aUCL5NubzyFZC__Rph2zZpkrAx9s'

export const supabase = createClient(supabaseUrl, supabaseKey)
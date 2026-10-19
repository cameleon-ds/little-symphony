/* ── Little Symphony — Supabase Client ── */
const SUPABASE_URL  = 'https://uyyillkilzsywcrrfbov.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eWlsbGtpbHpzeXdjcnJmYm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzU1NTUsImV4cCI6MjA5ODMxMTU1NX0.7hnsFSZQBoDardOPa6fO7TsGoov1p6DLN0i_Uqgy5Ls';
const _supabase     = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* Lien "mot de passe oublié" : si Supabase redirige ailleurs, envoyer vers la page de réinitialisation */
_supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY' && !location.pathname.endsWith('reset-password.html')) {
    location.href = new URL('reset-password.html', location.href).href;
  }
});

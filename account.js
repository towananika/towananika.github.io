const name = document.getElementById('account-name');
const login = document.getElementById('account-login');
const logout = document.getElementById('account-logout');
const status = document.getElementById('account-status');
function show(user) {
  name.textContent = user?.name || '';
  name.hidden = !user;
  logout.hidden = !user;
  login.hidden = !!user;
  status.textContent = '';
}
document.addEventListener('tri-user', event => show(event.detail));
logout.addEventListener('click', async () => {
  logout.disabled = true;
  try { await window.triLogout(); }
  catch { status.textContent = 'ログアウトできませんでした。もう一度お試しください。'; }
  finally { logout.disabled = false; }
});
// Reuse the same Firebase app and persistence as Triathlon on this origin.
// Account state is not authorization for private content.
try {
  await import('/triathlon/login/auth.js?v=0.28');
  if (window.TRI_USER !== undefined) show(window.TRI_USER);
} catch {
  status.textContent = 'ログイン状態を確認できませんでした。';
}

const url = 'http://127.0.0.1:8090/api/admins/auth-with-password';
const data = { identity: 'admin@ecosort.ai', password: 'your-admin-password-here' };

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(async res => {
  console.log(res.status);
  console.log(await res.text());
})
.catch(console.error);

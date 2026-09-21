async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/draws/DRW-2026-09/simulate', {
      method: 'POST',
      headers: {
        'x-user-id': 'user-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ drawMethod: 'algorithmic' }),
    });
    console.log('STATUS:', res.status, res.statusText);
    const text = await res.text();
    console.log('BODY:', text);
  } catch (err) {
    console.error('FETCH ERROR:', err);
  }
}
test();

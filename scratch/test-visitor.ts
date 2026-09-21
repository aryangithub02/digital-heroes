async function testVisitor() {
  const res = await fetch('http://localhost:3000/api/draws/DRW-2026-09/simulate', {
    method: 'POST',
    headers: {
      'x-user-id': 'visitor',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ drawMethod: 'algorithmic' }),
  });
  console.log('VISITOR STATUS:', res.status, res.statusText);
  const text = await res.text();
  console.log('VISITOR BODY:', text);
}
testVisitor();

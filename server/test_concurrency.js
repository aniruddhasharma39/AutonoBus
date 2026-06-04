const testConcurrency = async () => {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@garudaurbanlines.com', password: 'admin123' })
    });
    const userData = await loginRes.json();
    const token = userData.token;
    console.log('Login successful');

    // 2. Get assignments
    const assignRes = await fetch('http://localhost:5000/api/assignments');
    const assignments = await assignRes.json();
    if (!assignments || assignments.length === 0) {
      console.log('No assignments found. Cannot test.');
      return;
    }
    const targetAssignment = assignments[0];
    console.log(`Testing with Assignment ID: ${targetAssignment._id}`);

    // Generate random seat to prevent already booked issues from earlier runs
    const seatId = 'L' + Math.floor(Math.random() * 20 + 2); // random from L2 to L21

    const payload = {
      assignmentId: targetAssignment._id,
      seats: [{ seatNumber: seatId, passengerName: 'Test Concurrency', age: 25, gender: 'Male' }],
      totalAmount: 1000,
      boardingPoint: 'Boarding Point 1',
      droppingPoint: 'Dropping Point 1'
    };

    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    };

    // 3. Fire parallel booking requests to simulate concurrency
    console.log(`Firing parallel requests for seat ${seatId}...`);
    const results = await Promise.allSettled([
      fetch('http://localhost:5000/api/bookings', config).then(async r => { if (!r.ok) throw new Error((await r.json()).message); return r.json(); }),
      fetch('http://localhost:5000/api/bookings', config).then(async r => { if (!r.ok) throw new Error((await r.json()).message); return r.json(); }),
      fetch('http://localhost:5000/api/bookings', config).then(async r => { if (!r.ok) throw new Error((await r.json()).message); return r.json(); })
    ]);

    let successCount = 0;
    let failCount = 0;

    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        successCount++;
        console.log(`Request ${index + 1} Succeeded with PNR: ${res.value.pnr}`);
      } else {
        failCount++;
        console.log(`Request ${index + 1} Failed with: ${res.reason.message}`);
      }
    });

    console.log(`\nCONCURRENCY TEST RESULT: ${successCount} Success, ${failCount} Failures`);
    if (successCount === 1) {
      console.log('=> TEST PASSED: Only 1 request succeeded for the same seat!');
    } else {
      console.log('=> TEST FAILED: Concurrency allowed multiple bookings or all failed unexpectedly.');
    }

  } catch (error) {
    console.error('Test script error:', error.message);
  }
};

testConcurrency();

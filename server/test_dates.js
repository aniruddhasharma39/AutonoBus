const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

console.log("Date: 2024-03-18, offset: 0 =>", addDays('2024-03-18', 0));
console.log("Date: 2024-03-18, offset: 1 =>", addDays('2024-03-18', 1));
console.log("Date: 2024-03-18T00:00:00.000Z, offset: 1 =>", addDays('2024-03-18T00:00:00.000Z', 1));

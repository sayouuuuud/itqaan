// test-date2.ts
const startDate = "2026-03-06"; // Friday
const endDate = "2026-03-13"; // Next Friday
const days = [2]; // Only Tuesday (index 2 for Sunday=0)

const start = new Date(startDate);
const end = new Date(endDate);
const curr = new Date(start);

console.log("Looking for days:", days);
while (curr <= end) {
    const dayOfWeek = curr.getUTCDay(); // 0 is Sunday
    const dateStr = curr.toISOString().split('T')[0];

    console.log(`Checking ${dateStr} (UTC Day: ${dayOfWeek})`);

    if (days.includes(dayOfWeek)) {
        console.log(`>>> MATCH: ${dateStr} is a Tuesday`);
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
}

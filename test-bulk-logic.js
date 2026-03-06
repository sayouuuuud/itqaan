/**
 * Test to see why bulk schedule days are not matching
 */
const startDate = "2026-03-06"; // Friday
const endDate = "2026-03-20";   // Friday
const days = [5, 3]; // Friday and Wednesday

const [sY, sM, sD] = startDate.split('-').map(Number);
const [eY, eM, eD] = endDate.split('-').map(Number);

const curr = new Date(sY, sM - 1, sD);
const end = new Date(eY, eM - 1, eD);

console.log("Start Date (Local):", curr.toString());
console.log("End Date (Local):", end.toString());
console.log("Target Days:", days);

let dayMatchCount = 0;
while (curr <= end) {
    const dayOfWeek = curr.getDay(); // 0-Sunday
    if (days.includes(dayOfWeek)) {
        dayMatchCount++;
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        console.log(`MATCH: ${dateStr} (Day: ${dayOfWeek})`);
    } else {
        // console.log(`SKIP: ${curr.toDateString()} (Day: ${dayOfWeek})`);
    }
    curr.setDate(curr.getDate() + 1);
}

console.log("Final dayMatchCount:", dayMatchCount);

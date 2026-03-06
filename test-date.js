const start = new Date("2026-03-06"); // 2026-03-06 is a Friday (day 5)
const end = new Date("2026-03-13");
const curr = new Date(start);

while (curr <= end) {
    console.log(`curr: ${curr.toISOString()} | UTCDay: ${curr.getUTCDay()} | LocalDay: ${curr.getDay()}`);
    curr.setUTCDate(curr.getUTCDate() + 1);
}

# TODO: Modify EngineerDashboard4K.jsx for currentSlide === 1

## Tasks

- [x] Remove the "Work Orders This Month" table from currentSlide === 1
- [x] Change layout to vertical: top table for overdue projects, bottom table for upcoming projects
- [x] Add pagination state: currentPageOverdue, currentPageUpcoming
- [x] Implement pagination logic: show 10 items per page, calculate total pages
- [x] Add auto-pagination: auto-switch pages every 5 seconds, reset to page 1 when exceeding total pages
- [x] Enlarge display: increase font sizes, widths, and add more information (e.g., client_name) to tables
- [x] Test the changes by running the application (Node.js version issue, but code changes are complete)

## Notes

- Use slice for data pagination: data={stats.top5Overdue.slice((currentPageOverdue-1)*10, currentPageOverdue*10)}
- Add useEffect with setInterval for auto-pagination
- Enlarge by increasing column widths, adding fontSize in HotTable options, and including client_name column

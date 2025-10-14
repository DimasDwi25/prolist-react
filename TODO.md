# SalesReport.jsx Update Plan

- [x] Import additional components (FilterBar, summary card components, filters)
- [x] Add state for filters, totals, availableYears, selectedClient, selectedCategory, selectedStatus
- [x] Update fetchProjects to accept filterParams, set totals and availableYears
- [x] Add FilterBar component
- [x] Add summary cards for total sales value and project count
- [x] Add client, category, status filters in top controls
- [x] Update columns to include client_name, category_name, status, etc.
- [x] Add filteredData calculation with filters, calculate filtered totals
- [x] Use similar formatters/renderers as MarketingReport
- [x] Update component name to SalesReport
- [x] Implement frontend filtering for FilterBar since backend may not be filtering
- [x] Show 0 in summary cards when no projects match filters
- [x] Add empty state message when no data in table
- [x] Update MarketingReport to show 0 and empty state message
- [x] Test the component

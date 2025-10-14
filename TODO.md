# TODO List for ViewPhcModal Enhancement

## Tasks

- [x] Add "View BOQ" button in Step 2 if BOQ is applicable
- [x] Add "View SOW" button in Step 3 if Scope of Work document is applicable
- [x] Import BoqModal and SowModal components
- [x] Add state for modal open/close
- [x] Retrieve token and role from storage for modal props
- [x] Add modal components at the end of the return statement
- [x] Test the functionality to ensure buttons appear correctly and modals open

## Notes

- BOQ is applicable if `phc?.boq === "A"`
- SOW is applicable if there's a document with name including "scope_of_work_approval" and status "A"
- Use existing BoqModal and SowModal components for viewing
- Props for modals: projectId (project?.pn_number), projectValue (project?.po_value), token (from storage), role (from storage)

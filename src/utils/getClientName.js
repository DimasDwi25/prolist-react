/**
 * Utility function to extract client name from an object.
 * Checks for client name in multiple possible locations.
 * @param {Object} obj - The object containing client information
 * @returns {string} - The client name or "-" if not found
 */
export const getClientName = (obj) => {
  if (!obj) return "-";
  return (
    obj.client?.name || obj.quotation?.client?.name || obj.client_name || "-"
  );
};

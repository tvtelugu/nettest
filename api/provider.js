/**
 * Authorized provider adapter placeholder.
 *
 * Implement only against a service you are authorized to access.
 * Contract:
 *   async function resolve(req) -> JSON-serializable object
 *
 * Example shape:
 *   return {
 *     success: true,
 *     id,
 *     type,
 *     data: ...
 *   };
 */
async function resolve(req) {
  throw new Error("No authorized provider configured");
}

module.exports = { resolve };

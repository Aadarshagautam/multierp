import { sendError } from "../utils/response.js";

const formatIssues = (issues) =>
  issues
    .map((issue) => {
      const path = Array.isArray(issue.path) && issue.path.length > 0
        ? `${issue.path.join(".")}: `
        : "";
      return `${path}${issue.message}`;
    })
    .join(", ");

export const validateRequest = ({ body, params, query } = {}) => {
  return (req, res, next) => {
    const validated = {};

    if (body) {
      const result = body.safeParse(req.body);
      if (!result.success) {
        return sendError(res, {
          status: 400,
          message: formatIssues(result.error.issues),
        });
      }
      validated.body = result.data;
    }

    if (params) {
      const result = params.safeParse(req.params);
      if (!result.success) {
        return sendError(res, {
          status: 400,
          message: formatIssues(result.error.issues),
        });
      }
      validated.params = result.data;
    }

    if (query) {
      const result = query.safeParse(req.query);
      if (!result.success) {
        return sendError(res, {
          status: 400,
          message: formatIssues(result.error.issues),
        });
      }
      validated.query = result.data;
    }

    req.validated = validated;
    return next();
  };
};

export default validateRequest;

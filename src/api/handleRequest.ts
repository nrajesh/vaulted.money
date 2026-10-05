import type { ApiRequest, ApiResponse } from "./http";
import { dispatch, type ApiServices } from "./router";
import { routes } from "./routes";

/** Entry point: runs one request against the full route table. Never throws. */
export const handleApiRequest = (
  request: ApiRequest,
  services: ApiServices,
): Promise<ApiResponse> => dispatch(routes, request, services);

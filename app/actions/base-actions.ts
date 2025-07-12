export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export function createActionResult<T>(
  success: boolean,
  data?: T,
  error?: string
): ActionResult<T> {
  return { success, data, error };
}

export function handleActionError(error: any, defaultMessage: string): ActionResult {
  console.error(defaultMessage, error);
  return createActionResult(false, undefined, defaultMessage);
}
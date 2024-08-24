export function responseBody(
  body: any,
  status: number = 200,
  message: string = "OK"
) {
  return {
    status: 200,
    message: "OK",
    body,
  };
}

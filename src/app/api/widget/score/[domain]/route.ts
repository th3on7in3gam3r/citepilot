import { handleWidgetScoreRequest, handleWidgetScoreOptions } from "@/lib/widget/score-handler";

export async function OPTIONS(): Promise<Response> {
  return handleWidgetScoreOptions();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ domain: string }> },
): Promise<Response> {
  const { domain } = await context.params;
  return handleWidgetScoreRequest(request, domain);
}

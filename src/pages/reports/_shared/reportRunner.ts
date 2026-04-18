import {
  createReport,
  getReport,
  type CreateReportPayload,
  type ReportEntity,
} from "../../../services/api/report.services";

export async function createAndWaitReport(
  payload: CreateReportPayload,
  opts?: { maxTries?: number; intervalMs?: number },
): Promise<ReportEntity> {
  const maxTries = opts?.maxTries ?? 25;
  const intervalMs = opts?.intervalMs ?? 800;

  const created = await createReport(payload);
  const id = created?.id;
  if (!id) throw new Error("Create report gagal (id kosong)");

  let tries = 0;
  while (tries < maxTries) {
    tries += 1;

    const r = await getReport(id);
    if (r.status === "completed") return r;
    if (r.status === "failed")
      throw new Error(r.errorMessage || "Report failed");

    await new Promise((res) => setTimeout(res, intervalMs));
  }

  return await getReport(id);
}

"use client";

import { useEffect, useRef } from "react";
import { notification, Progress } from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useCsvImportStore } from "../../stores/csvImportStore";
import { getProductCsvImportStatus } from "../../services/api/product.services";
import type { ProductCsvImportJobStatusPayload } from "../../services/api/product.services";

const KEY = "product-csv-import";

function getSnapshotPercent(s: ProductCsvImportJobStatusPayload) {
  if (s.status === "completed" || s.status === "completed_with_errors") return 100;
  return Math.max(0, Math.min(100, Number(s.progressPercent || 0)));
}

function getSuccessfulProducts(s: ProductCsvImportJobStatusPayload) {
  const statsCount =
    Number(s.stats?.productCreated || 0) + Number(s.stats?.productUpdated || 0);
  if (statsCount > 0) return statsCount;
  const direct = Number(s.successfulProducts || 0);
  if (direct > 0) return direct;
  return Number(s.processedProducts || 0);
}

function hideProgressToast() {
  const el = document.querySelector(
    ".ant-notification-bottomRight .ant-notification-notice"
  ) as HTMLElement | null;
  if (el) {
    el.style.transition = "transform 0.22s cubic-bezier(0.4,0,0.6,1), opacity 0.22s ease";
    el.style.transform = "translateX(calc(100% + 32px))";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    setTimeout(() => notification.destroy(KEY), 240);
  } else {
    notification.destroy(KEY);
  }
}

function showProgressToast(snapshot: ProductCsvImportJobStatusPayload) {
  const percent = getSnapshotPercent(snapshot);
  const isDone = percent >= 100;
  const processed = Number(snapshot.processedProducts || 0);
  const total = Number(snapshot.totalProducts || 0);
  const valueText = total > 0 ? `${processed}/${total}` : undefined;

  notification.open({
    key: KEY,
    message: "",
    closeIcon: null,
    placement: "bottomRight",
    duration: 0,
    style: { width: 340, padding: "10px 12px" },
    description: (
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 13, lineHeight: 1.35 }}>Mengupload produk</span>
          <span style={{ fontSize: 12, color: isDone ? "#52c41a" : "#595959", whiteSpace: "nowrap", fontWeight: isDone ? 600 : 400 }}>
            {isDone ? "Selesai" : `${percent}%`}
          </span>
        </div>
        <Progress
          percent={percent}
          size="small"
          showInfo={false}
          status={isDone ? "success" : "active"}
          style={{ margin: 0 }}
        />
        {(valueText || snapshot.currentProduct) && !isDone ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#8c8c8c", minWidth: 0 }}>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {snapshot.currentProduct ?? ""}
            </span>
            {valueText && (
              <span style={{ whiteSpace: "nowrap", flexShrink: 0 }}>{valueText}</span>
            )}
          </div>
        ) : null}
      </div>
    ),
  });
}

export default function CsvImportWatcher() {
  const { jobId, job, updateJob, setImportResult, reset, onOpenDialog, onSuccess, dialogOpen } =
    useCsvImportStore();
  const dialogOpenRef = useRef(dialogOpen);
  const handledRef = useRef<string | null>(null);
  useEffect(() => {
    dialogOpenRef.current = dialogOpen;
    if (dialogOpen) {
      hideProgressToast();
    } else if (job && job.status !== "completed" && job.status !== "completed_with_errors" && job.status !== "failed") {
      showProgressToast(job);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    const currentJobId = jobId;

    const handleDone = (snapshot: ProductCsvImportJobStatusPayload) => {
      if (handledRef.current === currentJobId) return;
      handledRef.current = currentJobId;

      const successCount = getSuccessfulProducts(snapshot);
      const errorCount = Number(snapshot.errorCount || 0);
      const created = Number(snapshot.stats?.productCreated || 0);
      const updated = Number(snapshot.stats?.productUpdated || 0);
      const variantCreated = Number(snapshot.stats?.variantCreated || 0);
      const mediaCreated = Number(snapshot.stats?.mediaCreated || 0);

      notification.destroy(KEY);

      if (snapshot.status === "completed") {
        setImportResult({ type: "success", successCount, created, updated, variantCreated, mediaCreated, errorCount: 0 });
        onOpenDialog?.(true);
        onSuccess?.();

        notification.success({
          key: KEY + "-done",
          message: "",
          closeIcon: null,
          placement: "bottomRight",
          duration: 6,
          style: { width: 340, padding: "10px 12px" },
          description: (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircleFilled style={{ color: "#52c41a", fontSize: 16 }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Upload produk selesai</span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#595959" }}>
                <span>Total: <b style={{ color: "#000" }}>{successCount}</b></span>
                {created > 0 && <span>Baru: <b style={{ color: "#52c41a" }}>{created}</b></span>}
                {updated > 0 && <span>Diperbarui: <b style={{ color: "#1677ff" }}>{updated}</b></span>}
              </div>
            </div>
          ),
        });
        return;
      }

      if (snapshot.status === "completed_with_errors") {
        setImportResult({ type: "warning", successCount, created, updated, variantCreated, mediaCreated, errorCount });
        onOpenDialog?.(true);
        onSuccess?.();

        notification.warning({
          key: KEY + "-done",
          message: "",
          closeIcon: null,
          placement: "bottomRight",
          duration: 8,
          style: { width: 340, padding: "10px 12px" },
          description: (
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Selesai dengan kendala</div>
              <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#595959" }}>
                <span>Berhasil: <b style={{ color: "#52c41a" }}>{successCount}</b></span>
                <span>Gagal: <b style={{ color: "#faad14" }}>{errorCount}</b></span>
              </div>
              <div style={{ fontSize: 12, color: "#8c8c8c" }}>Buka dialog upload untuk detail error</div>
            </div>
          ),
        });
        return;
      }

      // failed
      setImportResult({ type: "error", successCount: 0, created: 0, updated: 0, variantCreated: 0, mediaCreated: 0, errorCount: 0, message: snapshot.message || "Import gagal" });
      onOpenDialog?.(true);

      notification.error({
        key: KEY + "-done",
        message: "",
        placement: "bottomRight",
        duration: 6,
        style: { width: 340, padding: "10px 12px" },
        description: snapshot.message || "Import gagal",
      });
    };

    const poll = async () => {
      try {
        const res = await getProductCsvImportStatus(currentJobId);
        if (cancelled) return;
        const snap = res?.serve;
        if (!snap) return;

        updateJob({ ...snap, id: snap.id || currentJobId });

        if (snap.status === "completed" || snap.status === "completed_with_errors" || snap.status === "failed") {
          cancelled = true;
          handleDone(snap);
        } else if (dialogOpenRef.current) {
          notification.destroy(KEY);
        } else {
          showProgressToast(snap);
        }
      } catch (err) {
        // swallow polling errors
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), 1500);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [jobId]);

  return null;
}

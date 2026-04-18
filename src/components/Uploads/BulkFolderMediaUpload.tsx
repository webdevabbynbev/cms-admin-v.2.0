import React, { useMemo, useRef, useState } from "react";
import {
  Card,
  Button,
  Progress,
  Table,
  Typography,
  Space,
  message,
  InputNumber,
  Select,
  Tooltip,
  theme,
} from "antd";
import { InfoCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import http from "../../api/http";
import { useThemeStore } from "../../hooks/useThemeStore";

const { Text } = Typography;

type ErrRow = { file: string; reason: string };

// ========= helpers =========
function basename(p: string) {
  return String(p || "")
    .replace(/\\/g, "/")
    .split("/")
    .pop()!;
}

function isJunkFile(nameOrPath: string) {
  const b = basename(nameOrPath);
  const lower = b.toLowerCase();
  return (
    b === ".DS_Store" ||
    lower === "thumbs.db" ||
    lower === "desktop.ini" ||
    b.startsWith("._")
  );
}

/**
 * Format yang diterima:
 *  - 8993137695169.png
 *  - 8993137695169-1.png
 *  - 8993137695169_2.png
 *  - 8993137695169.2.png
 *  - 8993137695169.A.png
 *  - 8993137695169.A-1.png
 *  - 8993137695169.A_2.png
 *  - 8993137695169.A.2.png
 *
 * NOTE:
 * - Slot valid 1..4
 * - " (2)" suffix (Windows copy) akan di-trim biar tetap kebaca.
 */
function parseName(rawNameOrPath: string): { code: string; slotFromName: number | null } | null {
  const b = basename(rawNameOrPath).trim();
  if (!b) return null;

  // ext
  const mExt = b.match(/\.(png|jpe?g|webp)$/i);
  if (!mExt) return null;

  const extPart = mExt[0]; // ".png"
  let stem = b.slice(0, -extPart.length).trim();

  // strip Windows " (2)" copy suffix
  stem = stem.replace(/\s*\(\d+\)\s*$/, "").trim();
  if (!stem) return null;

  // detect slot suffix: -1 / _2 / .3
  let slotFromName: number | null = null;
  const mSlot = stem.match(/^(.*?)(?:[-_.]([1-4]))$/);
  if (mSlot) {
    stem = mSlot[1].trim();
    slotFromName = Number(mSlot[2]);
  }

  // code validation: alnum + . _ -
  // (no space, no parentheses)
  if (!/^[0-9A-Za-z][0-9A-Za-z._-]*$/.test(stem)) return null;

  return { code: stem, slotFromName };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Ambil origin (http://localhost:3333) dari http.defaults.baseURL.
 * Contoh baseURL: "http://localhost:3333/api/v1" => origin "http://localhost:3333"
 * Kalau kosong, fallback ke "http://localhost:3333"
 */
function getOrigin(): string {
  const base = String((http as any)?.defaults?.baseURL || "");
  const m = base.match(/^https?:\/\/[^/]+/);
  return m?.[0] || "http://localhost:3333";
}

export default function BulkFolderMediaUpload() {
  const { token } = theme.useToken();
  const { isDarkMode } = useThemeStore();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [batchSize, setBatchSize] = useState<number>(100);
  const [running, setRunning] = useState(false);

  // slot override hanya dipakai kalau filename tidak ada pemisah slot (-1/-2/_2/.2)
  const [slotOverride, setSlotOverride] = useState<number>(1);

  const [totalValid, setTotalValid] = useState(0);
  const [done, setDone] = useState(0);
  const [ok, setOk] = useState(0);
  const [fail, setFail] = useState(0);

  const [invalid, setInvalid] = useState<ErrRow[]>([]);
  const [errors, setErrors] = useState<ErrRow[]>([]);

  const progress = useMemo(() => {
    if (!totalValid) return 0;
    return Math.round((done / totalValid) * 100);
  }, [done, totalValid]);

  const pickFolder = () => inputRef.current?.click();

  const uploadBatch = async (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));

    fd.append("mode", "replace");
    fd.append("type", "1");
    // backend akan pakai slotOverride hanya jika slot tidak explicit di nama file
    fd.append("slot", String(slotOverride));

    // route TANPA /api/v1
    const origin = getOrigin();
    const url = `${origin}/product-medias/bulk-by-barcode`;

    const res = await http.post(url, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data?.serve;
  };

  const onSelectFolder: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;

    setInvalid([]);
    setErrors([]);
    setDone(0);
    setOk(0);
    setFail(0);

    const all = Array.from(list);

    const valid: File[] = [];
    const invalidRows: ErrRow[] = [];

    for (const f of all) {
      const displayName = ((f as any).webkitRelativePath || f.name) as string;

      // skip junk file biar invalid = 0
      if (isJunkFile(displayName) || isJunkFile(f.name)) continue;

      const p = parseName(displayName);
      if (!p) invalidRows.push({ file: displayName, reason: "invalid_name_or_ext" });
      else valid.push(f);
    }

    setInvalid(invalidRows);
    setTotalValid(valid.length);

    if (valid.length === 0) {
      message.error(
        "Tidak ada file valid. Contoh: 899..A-1.png / 899..A_2.png / 899..-1.png / 899...png"
      );
      return;
    }

    setRunning(true);

    try {
      const size = Math.max(10, Math.min(batchSize, 200));
      const batches = chunk(valid, size);

      let _done = 0;
      let _ok = 0;
      let _fail = 0;
      const _errs: ErrRow[] = [];

      for (const b of batches) {
        try {
          const result = await uploadBatch(b);

          _done += b.length;
          _ok += Number(result?.success || 0);
          _fail += Number(result?.failed || 0);

          const batchErrors = (result?.errors || []) as ErrRow[];
          if (batchErrors?.length) _errs.push(...batchErrors);
        } catch (err: any) {
          _done += b.length;
          _fail += b.length;

          const msg =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Upload gagal (batch)";

          _errs.push(
            ...b.map((f) => ({
              file: ((f as any).webkitRelativePath || f.name) as string,
              reason: String(msg),
            }))
          );

          
        }

        setDone(_done);
        setOk(_ok);
        setFail(_fail);
        setErrors([..._errs]);
      }

      message.success(
        `Selesai. success=${_ok}, failed=${_fail}, invalid=${invalidRows.length}`
      );
    } finally {
      setRunning(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Card
      title={<span style={{ fontWeight: 600 }}>📦 Manajemen Massal: Aset Media</span>}
      style={{
        borderRadius: 16,
        boxShadow: isDarkMode ? "none" : "0 4px 15px rgba(0,0,0,0.03)",
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={16}>
        <div style={{ color: token.colorTextDescription, fontSize: 13, marginBottom: 4 }}>
          Gunakan folder berisi gambar yang dinamai sesuai SKU atau Barcode untuk memperbarui media varian produk secara massal.
        </div>

        <Space wrap size={[16, 16]} style={{ background: isDarkMode ? token.colorFillAlter : '#f9f9f9', padding: '12px 16px', borderRadius: 8 }}>
          <Button type="primary" onClick={pickFolder} disabled={running}>
            Pilih Folder & Upload
          </Button>

          <Space size={8}>
            <Text>Batch size:</Text>
            <InputNumber
              min={10}
              max={200}
              value={batchSize}
              onChange={(v) => setBatchSize(Number(v || 100))}
              disabled={running}
              style={{ width: 70 }}
            />
          </Space>

          <Space size={8}>
            <Text>
              Slot (Default):
              <Tooltip title="Dipakai jika nama file tidak mengandung pemisah slot (contoh: 89931.png akan masuk ke slot ini. Sedangkan 89931_2.png akan otomatis masuk ke slot 2)">
                <QuestionCircleOutlined style={{ marginLeft: 4, color: '#bfbfbf' }} />
              </Tooltip>
            </Text>
            <Select
              value={slotOverride}
              onChange={(v: number) => setSlotOverride(v)}
              disabled={running}
              style={{ width: 70 }}
              options={[
                { value: 1, label: "1" },
                { value: 2, label: "2" },
                { value: 3, label: "3" },
                { value: 4, label: "4" },
              ]}
            />
          </Space>

          <Text type="secondary" style={{ fontSize: 12 }}>
            <InfoCircleOutlined style={{ marginRight: 4 }} />
            Mode: replace (slot lama ditimpa)
          </Text>
        </Space>

        <Progress percent={progress} strokeColor={progress === 100 ? '#52c41a' : '#1677ff'} />

        <Space wrap size={[24, 8]}>
          <Text><Text type="secondary">Total valid:</Text> <strong>{totalValid}</strong></Text>
          <Text><Text type="secondary">Processed:</Text> <strong>{done}</strong></Text>
          <Text style={{ color: "#1677ff" }}><Text type="secondary">Success:</Text> <strong>{ok}</strong></Text>
          <Text style={{ color: "#ff4d4f" }}><Text type="secondary">Failed:</Text> <strong>{fail}</strong></Text>
          <Text><Text type="secondary">Invalid:</Text> <strong>{invalid.length}</strong></Text>
        </Space>

        {invalid.length > 0 && (
          <>
            <Text strong>Invalid filename (tidak diproses)</Text>
            <Table
              size="small"
              rowKey={(r) => `inv-${r.file}`}
              dataSource={invalid}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "File", dataIndex: "file" },
                { title: "Reason", dataIndex: "reason" },
              ]}
            />
          </>
        )}

        {errors.length > 0 && (
          <>
            <Text strong>Errors dari backend (diproses tapi gagal)</Text>
            <Table
              size="small"
              rowKey={(r) => `err-${r.file}-${r.reason}`}
              dataSource={errors}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "File", dataIndex: "file" },
                { title: "Reason", dataIndex: "reason" },
              ]}
            />
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          {...({ webkitdirectory: "", directory: "" } as any)}
          style={{ display: "none" }}
          onChange={onSelectFolder}
        />
      </Space>
    </Card>
  );
}

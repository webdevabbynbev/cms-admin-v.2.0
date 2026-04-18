import { Modal, Button } from "antd";

type Props = {
  open: boolean;
  loading?: boolean;
  count?: number;
  warningText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDeleteModal = ({
  open,
  loading,
  count = 1,
  warningText,
  onConfirm,
  onCancel,
}: Props) => {
  return (
    <Modal open={open} onCancel={onCancel} footer={null}>
      <h4 style={{ fontWeight: 600, marginBottom: 12 }}>
        Hapus Data
      </h4>

      <p>
        Apakah kamu yakin ingin menghapus{" "}
        {count > 1 ? `${count} data` : "data ini"}?
      </p>

      {warningText ? (
        <p style={{ color: "#cf1322", marginBottom: 12 }}>
          {warningText}
        </p>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button onClick={onCancel}>Batal</Button>
        <Button danger loading={loading} onClick={onConfirm}>
          Hapus
        </Button>
      </div>
    </Modal>
  );
};
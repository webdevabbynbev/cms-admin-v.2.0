import React, { useState, useEffect, useCallback } from "react";
import { Table, Card, Input, Space, Tag, Image, Typography, message, Button, Popconfirm, Tooltip, Modal, Select, Form } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { SearchOutlined, InstagramOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { getAbeautiesSquadList, updateAbeautiesSquadStatus } from "../../../api/abeauties-squad";

type UserType = "abeauties" | "kol";

const { Title, Link } = Typography;

type SquadMember = {
  id: number | string;
  full_name?: string;
  gender?: string;
  instagram_username?: string;
  tiktok_username?: string;
  whatsapp_number?: string;
  domisili?: string;
  instagram_proof_url?: string;
  tiktok_proof_url?: string;
  status?: string;
  admin_notes?: string | null;
  user_type?: UserType | null;
  created_at?: string;
};

const userTypeColor: Record<UserType, string> = {
  abeauties: "magenta",
  kol: "geekblue",
};

const userTypeLabel: Record<UserType, string> = {
  abeauties: "Abeauties",
  kol: "KOL",
};

type ServeListPayload = {
  currentPage: number;
  perPage: number;
  total: number;
  data: SquadMember[];
};

const statusColor: Record<string, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
};

type ActionHandlers = {
  onConfirm: (member: SquadMember) => void;
  onReject: (id: number | string) => Promise<void>;
  onUserTypeChange: (id: number | string, userType: UserType) => void;
  userTypeDraft: Record<string, UserType>;
  loadingId: number | string | null;
};

const buildColumns = (handlers: ActionHandlers): ColumnsType<SquadMember> => [
  {
    title: "No",
    width: 55,
    fixed: "left",
    render: (_: unknown, __: unknown, index: number) => index + 1,
  },
  {
    title: "Nama",
    dataIndex: "full_name",
    width: 160,
    ellipsis: true,
    render: (text: string) => text ?? "-",
  },
  {
    title: "Gender",
    dataIndex: "gender",
    width: 90,
    render: (text: string) => text ?? "-",
  },
  {
    title: "Instagram",
    dataIndex: "instagram_username",
    width: 170,
    ellipsis: true,
    render: (username: string) =>
      username ? (
        <Link href={`https://instagram.com/${username}`} target="_blank">
          <InstagramOutlined /> @{username}
        </Link>
      ) : (
        "-"
      ),
  },
  {
    title: "TikTok",
    dataIndex: "tiktok_username",
    width: 150,
    ellipsis: true,
    render: (username: string) =>
      username ? (
        <Link href={`https://tiktok.com/@${username}`} target="_blank">
          @{username}
        </Link>
      ) : (
        "-"
      ),
  },
  {
    title: "WhatsApp",
    dataIndex: "whatsapp_number",
    width: 150,
    render: (text: string) =>
      text ? (
        <Link href={`https://wa.me/${text.replace(/^0/, "62").replace(/\D/g, "")}`} target="_blank">
          {text}
        </Link>
      ) : (
        "-"
      ),
  },
  {
    title: "Domisili",
    dataIndex: "domisili",
    width: 200,
    ellipsis: true,
    render: (text: string) => text ?? "-",
  },
  {
    title: "Bukti IG",
    dataIndex: "instagram_proof_url",
    width: 80,
    align: "center",
    render: (url: string) =>
      url ? (
        <Image
          src={url}
          width={56}
          wrapperStyle={{ borderRadius: 4, overflow: "hidden" }}
          style={{ objectFit: "cover", height: 56, display: "block" }}
          preview={{ src: url }}
        />
      ) : (
        "-"
      ),
  },
  {
    title: "Bukti TikTok",
    dataIndex: "tiktok_proof_url",
    width: 95,
    align: "center",
    render: (url: string) =>
      url ? (
        <Image
          src={url}
          width={56}
          wrapperStyle={{ borderRadius: 4, overflow: "hidden" }}
          style={{ objectFit: "cover", height: 56, display: "block" }}
          preview={{ src: url }}
        />
      ) : (
        "-"
      ),
  },
  {
    title: "Status",
    dataIndex: "status",
    width: 100,
    align: "center",
    render: (status: string) => (
      <Tag color={statusColor[status] ?? "default"}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : "-"}
      </Tag>
    ),
  },
  {
    title: "Status User",
    dataIndex: "user_type",
    width: 150,
    align: "center",
    render: (value: UserType | null | undefined, record: SquadMember) => {
      const isPending = record.status === "pending";
      // Pending → inline dropdown (editable). Approved/Rejected → tag display.
      if (!isPending) {
        return value ? (
          <Tag color={userTypeColor[value]}>{userTypeLabel[value]}</Tag>
        ) : (
          "-"
        );
      }
      const draft = handlers.userTypeDraft[String(record.id)] ?? value ?? "abeauties";
      return (
        <Select
          size="small"
          style={{ width: "100%" }}
          value={draft}
          onChange={(v) => handlers.onUserTypeChange(record.id, v)}
          options={[
            { value: "abeauties", label: "Abeauties" },
            { value: "kol", label: "KOL" },
          ]}
        />
      );
    },
  },
  {
    title: "Tanggal Daftar",
    dataIndex: "created_at",
    width: 180,
    render: (text: string) => {
      if (!text) return "-";
      return new Date(text).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  {
    title: "Aksi",
    key: "action",
    width: 120,
    fixed: "right",
    align: "center",
    render: (_: unknown, record: SquadMember) => {
      const isPending = record.status === "pending";
      const isLoading = handlers.loadingId === record.id;
      const draftType =
        handlers.userTypeDraft[String(record.id)] ?? (record.user_type as UserType) ?? "abeauties";
      return (
        <Space size={6}>
          <Tooltip title="Konfirmasi">
            <Popconfirm
              title={`Konfirmasi ${record.full_name}?`}
              description={`Status User: ${userTypeLabel[draftType]}`}
              okText="Ya"
              cancelText="Batal"
              onConfirm={() => handlers.onConfirm(record)}
              disabled={!isPending}
            >
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                loading={isLoading}
                disabled={!isPending}
                style={{ backgroundColor: isPending ? "#52c41a" : undefined, borderColor: isPending ? "#52c41a" : undefined }}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Tolak">
            <Popconfirm
              title={`Tolak pendaftaran ${record.full_name}?`}
              okText="Ya"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
              onConfirm={() => handlers.onReject(record.id)}
              disabled={!isPending}
            >
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                loading={isLoading}
                disabled={!isPending}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      );
    },
  },
];

export default function TableAbeautiesSquad() {
  const [data, setData] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<number | string | null>(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const [userTypeDraft, setUserTypeDraft] = useState<Record<string, UserType>>({});

  const fetchData = useCallback(
    async (page = 1, perPage = 20, name = "") => {
      setLoading(true);
      try {
        const res = await getAbeautiesSquadList({ page, per_page: perPage, name: name || undefined });
        const serve: ServeListPayload | SquadMember[] = res.data?.serve ?? [];
        let list: SquadMember[];
        let total: number;

        if (Array.isArray(serve)) {
          list = serve;
          total = serve.length;
        } else {
          list = serve.data ?? [];
          total = serve.total ?? list.length;
        }

        setData(list);
        setPagination((prev) => ({ ...prev, current: page, pageSize: perPage, total }));
      } catch (err) {
        
        message.error("Gagal memuat data Abeauties Squad");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(1, pagination.pageSize, search);
  }, []);

  const handleUpdateStatus = useCallback(
    async (
      id: number | string,
      status: "approved" | "rejected",
      userType?: UserType,
    ) => {
      setLoadingId(id);
      try {
        await updateAbeautiesSquadStatus(id, status, userType ? { user_type: userType } : {});
        message.success(status === "approved" ? "Pendaftaran dikonfirmasi" : "Pendaftaran ditolak");
        setData((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, status, ...(userType ? { user_type: userType } : {}) }
              : item,
          ),
        );
      } catch (err) {
        
        message.error("Gagal mengubah status");
      } finally {
        setLoadingId(null);
      }
    },
    [],
  );

  const handleConfirm = async (member: SquadMember) => {
    const userType =
      userTypeDraft[String(member.id)] ?? (member.user_type as UserType) ?? "abeauties";
    await handleUpdateStatus(member.id, "approved", userType);
    setUserTypeDraft((prev) => {
      const next = { ...prev };
      delete next[String(member.id)];
      return next;
    });
  };

  const columns = buildColumns({
    onConfirm: handleConfirm,
    onReject: (id) => handleUpdateStatus(id, "rejected"),
    onUserTypeChange: (id, ut) =>
      setUserTypeDraft((prev) => ({ ...prev, [String(id)]: ut })),
    userTypeDraft,
    loadingId,
  });

  const handleTableChange = (pag: TablePaginationConfig) => {
    const page = pag.current ?? 1;
    const pageSize = pag.pageSize ?? 20;
    fetchData(page, pageSize, search);
  };

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, search);
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Title level={4} style={{ margin: 0 }}>
          Abeauties Squad
        </Title>

        <Space>
          <Input
            placeholder="Cari nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            suffix={
              <SearchOutlined
                style={{ cursor: "pointer" }}
                onClick={handleSearch}
              />
            }
            style={{ width: 280 }}
            allowClear
            onClear={() => {
              setSearch("");
              fetchData(1, pagination.pageSize, "");
            }}
          />
        </Space>

        <Table<SquadMember>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} anggota`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1620 }}
        />
      </Space>
    </Card>
  );
}

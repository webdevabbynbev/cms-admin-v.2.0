import React from "react";
import Table from "antd/es/table";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import Button from "antd/es/button";
import Input from "antd/es/input";
import Card from "antd/es/card";
import Popconfirm from "antd/es/popconfirm";
import Select from "antd/es/select";
import Modal from "antd/es/modal";
import Tooltip from "antd/es/tooltip";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import http from "../../../api/http";
import { Col, Row, Space, message } from "antd";
import moment from "moment";
import { useSearchParams } from "react-router-dom";
import FormAdmin from "../../Forms/Admin/FormAdmin";

type AdminRecord = {
  id: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roleName: string;
  createdAt: string;
  permissions?: string;
};

type ServePayload = {
  currentPage: string | number;
  perPage: string | number;
  total: string | number;
  data: AdminRecord[];
};

type ListResponse = {
  data?: {
    serve: ServePayload;
  };
};

type QueryParams = {
  name?: string;
  role?: string | number;
};

type ColumnsCtx = {
  fetch: () => void;
  setOpen: (open: boolean) => void;
  setOpenForm: (open: boolean) => void;
  setCurrent: (rec: AdminRecord | false) => void;
};

const columns = (props: ColumnsCtx): ColumnsType<AdminRecord> => [
  {
    title: "Name",
    dataIndex: "name",
  },
  {
    title: "Email",
    dataIndex: "email",
  },
  {
    title: "Role",
    dataIndex: "roleName",
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    render: (text: string) => moment(text).format("YYYY MMMM DD HH:mm"),
  },
  {
    title: "#",
    width: "10%",
    align: "center",
    dataIndex: "action",
    render: (_: unknown, record: AdminRecord) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Tooltip title="View Detail">
            <Button
              key="/detail"
              icon={<InfoCircleOutlined />}
              onClick={() => {
                props.setCurrent(record);
                props.setOpen(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Edit Admin">
            <Button
              type="primary"
              key="/edit"
              icon={<EditOutlined />}
              onClick={() => {
                props.setCurrent(record);
                props.setOpenForm(true);
              }}
            />
          </Tooltip>

          <Tooltip title="Delete Admin">
            <Popconfirm
              placement="left"
              title="Are you sure you want to delete this data?"
              onConfirm={async () => {
                try {
                  await http({
                    url: `/admin/users/${record.id}`,
                    method: "DELETE",
                  });
                  props.fetch();
                  message.success("Deleted successfully");
                } catch (err: unknown) {
                  const error = err as { response?: { data?: { message?: string; serve?: Array<{ message?: string }> } } };
                  const errorMsg = error?.response?.data?.message ||
                    error?.response?.data?.serve?.[0]?.message ||
                    "Failed to delete admin. Please try again.";
                  message.error(errorMsg);
                  
                }
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </div>
      </div>
    ),
  },
];

const TableAdmin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = React.useState<AdminRecord[]>([]);

  // Derived from URL
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("per_page")) || 10;
  const searchName = searchParams.get("q") || "";
  const filterRole = searchParams.get("role") || "";

  const [open, setOpen] = React.useState<boolean>(false);
  const [openForm, setOpenForm] = React.useState<boolean>(false);
  const [current, setCurrent] = React.useState<AdminRecord | false>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [formDirty, setFormDirty] = React.useState<boolean>(false);
  const pendingRequestRef = React.useRef<boolean>(false);
  const { Search } = Input;

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      pendingRequestRef.current = false;
    };
  }, []);

  const fetchList = React.useCallback(async (
    q: QueryParams = { name: searchName, role: filterRole },
    pageCfg?: TablePaginationConfig,
  ) => {
    // Prevent duplicate requests
    if (pendingRequestRef.current) {
      
      return;
    }

    pendingRequestRef.current = true;
    setLoading(true);

    try {
      const queryParams = new URLSearchParams();

      // Use provided page or fallback to current pagination state
      const currentPage = pageCfg?.current ?? page ?? 1;
      const size = pageCfg?.pageSize ?? pageSize ?? 10;

      queryParams.append("page", String(currentPage));
      queryParams.append("per_page", String(size));

      if (q.name) queryParams.append("q", q.name);
      if (q.role) queryParams.append("role", String(q.role));

      const url = `/admin/users?${queryParams.toString()}`;
      

      const resp = (await http.get(url, { timeout: 10000 })) as ListResponse;

      const serve = resp?.data?.serve;
      if (serve) {
        setData(serve.data || []);
        setTotal(Number(serve.total));
      }
    } catch (err: unknown) {
      const error = err as { name?: string; response?: { data?: { message?: string } }; message?: string };

      

      const errorMsg = error?.response?.data?.message || error?.message || "Failed to load admin list";
      message.error(errorMsg);
    } finally {
      pendingRequestRef.current = false;
      setLoading(false);
    }
  }, [page, pageSize, searchName, filterRole]);

  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <>
      <Card style={{ marginTop: 10 }}>
        <div
          className="flex flex-wrap"
          style={{ width: "100%", alignItems: "flex-end" }}
        >
          <div className="flex align-center">
            <span style={{ fontSize: 12 }}>Show</span>
            <Select<number>
              defaultActiveFirstOption={false}
              onChange={(e) => {
                setSearchParams((prev) => {
                  prev.set("per_page", String(e));
                  prev.set("page", "1");
                  return prev;
                });
              }}
              style={{ width: "80px", marginLeft: 10, marginRight: 10 }}
              value={pageSize}
            >
              <Select.Option value={10}>10</Select.Option>
              <Select.Option value={50}>50</Select.Option>
              <Select.Option value={100}>100</Select.Option>
              <Select.Option value={500}>500</Select.Option>
            </Select>
            <span style={{ fontSize: 12 }}>entries</span>
          </div>

          <Select<number>
            allowClear
            placeholder="Filter"
            style={{ width: "20%", marginLeft: "1%" }}
            value={filterRole ? Number(filterRole) : undefined}
            onChange={(e) => {
              setSearchParams((prev) => {
                if (e) prev.set("role", String(e));
                else prev.delete("role");
                prev.set("page", "1");
                return prev;
              });
            }}
          >
            <Select.Option value={1}>Admin</Select.Option>
            <Select.Option value={3}>Gudang</Select.Option>
            <Select.Option value={4}>Finance</Select.Option>
            <Select.Option value={5}>Media</Select.Option>
            <Select.Option value={6}>Cashier dan Gudang</Select.Option>
            <Select.Option value={7}>Cashier</Select.Option>
          </Select>

          <Space
            style={{ marginLeft: "auto" }}
            className="flex align-center mt-2"
          >
            <Search
              placeholder="Search Admin"
              defaultValue={searchName}
              onSearch={(e) => {
                setSearchParams((prev) => {
                  if (e.trim()) prev.set("q", e.trim());
                  else prev.delete("q");
                  prev.set("page", "1");
                  return prev;
                });
              }}
            />
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setOpenForm(true)}
            >
              Create New
            </Button>
          </Space>
        </div>
      </Card>

      <div className="overflow-x-auto md:overflow-visible">
        <Table<AdminRecord>
          style={{ marginTop: 10 }}
          columns={columns({
            fetch: fetchList,
            setOpen: (v) => setOpen(v),
            setOpenForm: (v) => setOpenForm(v),
            setCurrent: (v) => setCurrent(v),
          })}
          rowKey={(record) => String(record.id)}
          dataSource={data}
          scroll={{ x: "max-content" }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total,
          }}
          loading={loading}
          onChange={(p) => {
            setSearchParams((prev) => {
              prev.set("page", String(p.current));
              prev.set("per_page", String(p.pageSize));
              return prev;
            });
          }}
        />
      </div>

      <Modal
        centered
        open={open}
        title={"Detail Admin"}
        onCancel={() => {
          setOpen(false);
          setCurrent(false);
        }}
        footer={[
          <Button
            key="refresh"
            type="default"
            onClick={() => {
              if (current) {
                fetchList();
              }
            }}
          >
            Refresh
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setOpen(false);
              setCurrent(false);
            }}
          >
            Close
          </Button>,
        ]}
        width={600}
      >
        {current && (
          <>
            <Row style={{ marginTop: "0.5rem" }}>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Name
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.name}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Email
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.email}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Role
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>{current.roleName}</Col>
            </Row>
            <Row>
              <Col span={8} style={{ fontWeight: "bold" }}>
                Created At
              </Col>
              <Col span={1}>:</Col>
              <Col span={15}>
                {moment(current.createdAt).format("YYYY MMMM DD HH:mm")}
              </Col>
            </Row>
          </>
        )}
      </Modal>

      <Modal
        centered
        open={openForm}
        title={"Manage Admin"}
        onCancel={async () => {
          if (formDirty) {
            Modal.confirm({
              title: "Unsaved Changes",
              content:
                "You have unsaved changes. Are you sure you want to close?",
              okText: "Yes",
              cancelText: "No",
              onOk() {
                setOpenForm(false);
                setCurrent(false);
                setFormDirty(false);
                fetchList();
              },
            });
          } else {
            setOpenForm(false);
            setCurrent(false);
            setFormDirty(false);
            fetchList();
          }
        }}
        footer={null}
      >
        <FormAdmin
          data={current || undefined}
          handleClose={() => {
            setOpenForm(false);
            setCurrent(false);
            setFormDirty(false);
            fetchList();
          }}
          onFormChange={() => setFormDirty(true)}
        />
      </Modal>
    </>
  );
};

export default TableAdmin;

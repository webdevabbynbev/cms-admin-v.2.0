// RamadanDetailModal.tsx
import React from "react";
import {
  Modal,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Divider,
  Tag,
  Tooltip,
  theme,
} from "antd";
import {
  InfoCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GiftOutlined,
  TrophyOutlined,
  MailOutlined,
  WhatsAppOutlined,
  SendOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { RamadanParticipantRecord } from "./ramadhanTypes";

const toWhatsAppHref = (
  phone?: string | number | null,
): string | null => {
  if (phone === null || phone === undefined) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return normalized.length >= 8 ? `https://wa.me/${normalized}` : null;
};

const toGmailHref = (email?: string | null): string | null => {
  if (!email) return null;
  return `https://mail.google.com/mail/u/0/?view=cm&to=${encodeURIComponent(
    email,
  )}`;
};

interface RamadanDetailModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  current: RamadanParticipantRecord | false;
  setCurrent: (rec: RamadanParticipantRecord | false) => void;
  prizes: any[];
  selectedMilestones: { [key: number]: number | null };
  setPrizeModalOpen: (open: boolean) => void;
  setPrizeSelection: (selection: any) => void;
}

export default function RamadanDetailModal({
  open,
  setOpen,
  current,
  setCurrent,
  prizes,
  selectedMilestones,
  setPrizeModalOpen,
  setPrizeSelection,
}: RamadanDetailModalProps) {
  const { token } = theme.useToken();
  const waHref = current ? toWhatsAppHref(current.phone_number) : null;
  const mailHref = current ? toGmailHref(current.email) : null;

  return (
    <Modal
      centered
      open={open}
      title={
        <div
          style={{ display: "flex", alignItems: "center", fontSize: "16px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              background: token.colorFillAlter,
              borderRadius: "50%",
              marginRight: 12,
              border: `1px solid ${token.colorBorderSecondary}`
            }}
          >
            <InfoCircleOutlined
              style={{ color: token.colorPrimary, fontSize: "20px" }}
            />
          </div>
          <span style={{ fontWeight: 600 }}>Detail Peserta</span>
        </div>
      }
      onCancel={() => {
        setOpen(false);
        setCurrent(false);
      }}
      footer={[
        <Button key="close" onClick={() => setOpen(false)}>
          Tutup
        </Button>,
        <Button
          key="prize"
          type="primary"
          icon={<GiftOutlined />}
          onClick={() => {
            if (!current) return;
            const fromRecord = (milestone: number) => {
              const keySnake = `prize_${milestone}` as keyof RamadanParticipantRecord;
              const keyCamel = `prize${milestone}` as keyof RamadanParticipantRecord;
              return (current as any)[keySnake] ?? (current as any)[keyCamel] ?? null;
            };
            setPrizeSelection({
              7:
                fromRecord(7) ||
                (selectedMilestones[7]
                  ? (prizes.find(
                    (p: any) => Number(p.id) === Number(selectedMilestones[7]),
                  )?.name ?? null)
                  : null),
              15:
                fromRecord(15) ||
                (selectedMilestones[15]
                  ? (prizes.find(
                    (p: any) => Number(p.id) === Number(selectedMilestones[15]),
                  )?.name ?? null)
                  : null),
              30:
                fromRecord(30) ||
                (selectedMilestones[30]
                  ? (prizes.find(
                    (p: any) => Number(p.id) === Number(selectedMilestones[30]),
                  )?.name ?? null)
                  : null),
            });
            setPrizeModalOpen(true);
            setOpen(false);
          }}
        >
          Input Hadiah
        </Button>,
      ]}
      width={800}
    >
      {current ? (
        <div>
          {/* User Info Card */}
          <Card
            size="small"
            style={{
              marginBottom: 16,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 64,
                  height: 64,
                  background: token.colorPrimary,
                  borderRadius: "50%",
                }}
              >
                <UserOutlined style={{ color: "#fff", fontSize: "28px" }} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: token.colorText,
                    margin: "0 0 8px 0",
                  }}
                >
                  {current.name}
                </h3>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "13px",
                    color: "#595959",
                  }}
                >
                  <span>📱 {current.phone_number ?? "-"}</span>
                  <Tooltip
                    title={waHref ? "Kirim WhatsApp" : "Nomor tidak tersedia"}
                  >
                    <span style={{ display: "inline-flex" }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<WhatsAppOutlined style={{ color: "#25D366" }} />}
                        href={waHref ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        disabled={!waHref}
                        aria-label="Kirim WhatsApp"
                      />
                    </span>
                  </Tooltip>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "13px",
                    color: "#595959",
                  }}
                >
                  <span>
                    <MailOutlined style={{ marginRight: 6 }} />
                    {current.email ?? "-"}
                  </span>
                  <Tooltip
                    title={mailHref ? "Kirim Email" : "Email tidak tersedia"}
                  >
                    <span style={{ display: "inline-flex" }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<SendOutlined />}
                        href={mailHref ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        disabled={!mailHref}
                        aria-label="Kirim Email"
                      />
                    </span>
                  </Tooltip>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: "13px",
                    color: token.colorTextDescription,
                    marginTop: 2,
                  }}
                >
                  <EnvironmentOutlined style={{ marginTop: 2 }} />
                  <span>{current.address ?? "-"}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card
                style={{
                  textAlign: "center",
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: "8px",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Statistic
                  title={
                    <span style={{ color: token.colorTextDescription, fontSize: "12px" }}>
                      Total Check-in
                    </span>
                  }
                  value={(() => {
                    const tc = (current as any).totalCheckin;
                    if (tc !== undefined && tc !== null) return tc;
                    const a = Number(current.totalFasting || 0);
                    const b = Number(current.totalNotFasting || 0);
                    return a + b;
                  })()}
                  valueStyle={{
                    color: token.colorPrimary,
                    fontSize: "28px",
                    fontWeight: 700,
                  }}
                  prefix={<CheckCircleOutlined />}
                  suffix={<span style={{ fontSize: "14px" }}>hari</span>}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card
                style={{
                  textAlign: "center",
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: "8px",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Statistic
                  title={
                    <span style={{ color: token.colorTextDescription, fontSize: "12px" }}>
                      Total Puasa
                    </span>
                  }
                  value={current.totalFasting ?? 0}
                  valueStyle={{
                    color: token.colorSuccess,
                    fontSize: "28px",
                    fontWeight: 700,
                  }}
                  prefix={<CheckCircleOutlined />}
                  suffix={<span style={{ fontSize: "14px" }}>hari</span>}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card
                style={{
                  textAlign: "center",
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: "8px",
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Statistic
                  title={
                    <span style={{ color: token.colorTextDescription, fontSize: "12px" }}>
                      Tidak Puasa
                    </span>
                  }
                  value={current.totalNotFasting ?? 0}
                  valueStyle={{
                    color: token.colorWarning,
                    fontSize: "28px",
                    fontWeight: 700,
                  }}
                  prefix={<CloseCircleOutlined />}
                  suffix={<span style={{ fontSize: "14px" }}>hari</span>}
                />
              </Card>
            </Col>
          </Row>

          <Divider
            orientation="left"
            style={{ fontSize: "13px", fontWeight: 600, color: token.colorText }}
          >
            <GiftOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
            Status Hadiah Milestone
          </Divider>

          {/* Prize Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[7, 15, 30].map((milestone) => {
              const pid = selectedMilestones[milestone];
              const prize = prizes.find(
                (x: any) => Number(x.id) === Number(pid),
              );
              const recordPrize = (() => {
                const keySnake = `prize_${milestone}` as keyof RamadanParticipantRecord;
                const keyCamel = `prize${milestone}` as keyof RamadanParticipantRecord;
                return (current as any)[keySnake] ?? (current as any)[keyCamel] ?? null;
              })();
              const displayPrize = recordPrize || prize?.name || "Belum ada hadiah";
              const totalCheckin = (() => {
                const tc = (current as any).totalCheckin;
                if (tc !== undefined && tc !== null) return tc;
                const a = Number(current.totalFasting || 0);
                const b = Number(current.totalNotFasting || 0);
                return a + b;
              })();
              const isEligible = totalCheckin >= milestone;

              return (
                <Card
                  key={milestone}
                  size="small"
                  style={{
                    background: isEligible ? token.colorSuccessBg : token.colorFillAlter,
                    border: isEligible
                      ? `2px solid ${token.colorSuccessBorder}`
                      : `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: "8px",
                  }}
                  styles={{ body: { padding: 12 } }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: isEligible ? "#52c41a" : "#bfbfbf",
                        }}
                      >
                        <TrophyOutlined
                          style={{ color: "#fff", fontSize: "18px" }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "13px",
                            color: token.colorText,
                          }}
                        >
                          Milestone {milestone} Hari
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: token.colorTextDescription,
                            marginTop: 2,
                          }}
                        >
                          {isEligible ? (
                            <span style={{ color: "#52c41a" }}>
                              Memenuhi syarat
                            </span>
                          ) : (
                            <span>
                              Butuh {milestone - totalCheckin} hari lagi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Tag
                      color={
                        displayPrize !== "Belum ada hadiah"
                          ? isEligible
                            ? "success"
                            : "processing"
                          : "default"
                      }
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        padding: "4px 12px",
                      }}
                    >
                      {displayPrize}
                    </Tag>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Not Fasting Reasons */}
          {current.notFastingReasons &&
            current.notFastingReasons.length > 0 && (
              <>
                <Divider
                  orientation="left"
                  style={{ fontSize: "13px", fontWeight: 600, marginTop: 24 }}
                >
                  <CloseCircleOutlined
                    style={{ marginRight: 6, color: token.colorWarning }}
                  />
                  Alasan Tidak Puasa
                </Divider>
                <Card
                  size="small"
                  style={{
                    background: token.colorFillAlter,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: "8px",
                  }}
                >
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {current.notFastingReasons.map((reason, idx) => (
                      <li
                        key={idx}
                        style={{
                          color: token.colorText,
                          fontSize: "12px",
                          marginBottom: 4,
                        }}
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
        </div>
      ) : null
      }
    </Modal >
  );
}

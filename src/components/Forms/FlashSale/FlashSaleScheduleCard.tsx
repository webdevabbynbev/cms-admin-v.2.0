import React from "react";
import {
  Card,
  Col,
  DatePicker,
  Form,
  Radio,
  Row,
  Switch,
  TimePicker,
  Typography,
} from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

const FlashSaleScheduleCard: React.FC = () => {
  const form = Form.useFormInstance();
  const startValue = Form.useWatch("start_datetime", form);
  const endValue = Form.useWatch("end_datetime", form);
  const [mode, setMode] = React.useState<"daily" | "multi">("multi");
  const [dailyDate, setDailyDate] = React.useState<Dayjs | null>(null);
  const [dailyStartTime, setDailyStartTime] = React.useState<Dayjs | null>(
    null,
  );
  const [dailyEndTime, setDailyEndTime] = React.useState<Dayjs | null>(null);
  const initialized = React.useRef(false);
  const { Text } = Typography;

  React.useEffect(() => {
    if (initialized.current) return;
    if (
      startValue &&
      endValue &&
      dayjs.isDayjs(startValue) &&
      dayjs.isDayjs(endValue)
    ) {
      if (startValue.isSame(endValue, "day")) {
        setMode("daily");
        setDailyDate(startValue.startOf("day"));
        setDailyStartTime(startValue);
        setDailyEndTime(endValue);
      }
    }
    initialized.current = true;
  }, [startValue, endValue]);

  React.useEffect(() => {
    if (mode !== "daily") return;
    let nextStart: Dayjs | null = null;
    if (dailyDate && dailyStartTime) {
      nextStart = dailyDate
        .hour(dailyStartTime.hour())
        .minute(dailyStartTime.minute())
        .second(0);
      form.setFieldValue("start_datetime", nextStart);
    }
    if (dailyDate && dailyEndTime) {
      let nextEnd = dailyDate
        .hour(dailyEndTime.hour())
        .minute(dailyEndTime.minute())
        .second(0);
      if (nextStart && !nextEnd.isAfter(nextStart)) {
        const candidate = nextStart.add(1, "minute");
        nextEnd = candidate.isSame(nextStart, "day")
          ? candidate
          : nextStart.endOf("day");
        setDailyEndTime(nextEnd);
      }
      form.setFieldValue("end_datetime", nextEnd);
    }
  }, [mode, dailyDate, dailyStartTime, dailyEndTime, form]);

  const dailyStart =
    dailyDate && dailyStartTime
      ? dailyDate
          .hour(dailyStartTime.hour())
          .minute(dailyStartTime.minute())
          .second(0)
      : null;
  const dailyEnd =
    dailyDate && dailyEndTime
      ? dailyDate
          .hour(dailyEndTime.hour())
          .minute(dailyEndTime.minute())
          .second(0)
      : null;
  const isDailyInvalid = !!(
    dailyStart &&
    dailyEnd &&
    !dailyEnd.isAfter(dailyStart)
  );

  return (
    <Card
      size="small"
      title={
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
          }}
        >
          <ClockCircleOutlined
            style={{ color: "var(--ant-primary-color)", fontSize: 14 }}
          />
          Atur Waktu dan Status
        </span>
      }
      style={{
        marginBottom: 20,
        borderRadius: 12,
      }}
    >
      <Row gutter={16} style={{ marginBottom: 8 }}>
        <Col xs={24} md={8}>
          <Form.Item label="Tipe Rentang">
            <Radio.Group
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              style={{ width: "100%" }}
            >
              <Radio.Button value="daily">Per Hari</Radio.Button>
              <Radio.Button value="multi">Lebih dari 1 Hari</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>

      {mode === "daily" ? (
        <>
          <Form.Item
            name="start_datetime"
            rules={[{ required: true }]}
            hidden
          />
          <Form.Item name="end_datetime" rules={[{ required: true }]} hidden />
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item label="Tanggal" required>
                <DatePicker
                  value={dailyDate}
                  onChange={(val) => setDailyDate(val)}
                  format="YYYY-MM-DD"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Mulai" required>
                <TimePicker
                  value={dailyStartTime}
                  onChange={(val) => setDailyStartTime(val)}
                  format="HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Selesai" required>
                <TimePicker
                  value={dailyEndTime}
                  onChange={(val) => setDailyEndTime(val)}
                  format="HH:mm"
                  disabledTime={() => {
                    if (!dailyStartTime) return {};
                    const startHour = dailyStartTime.hour();
                    const startMinute = dailyStartTime.minute();
                    return {
                      disabledHours: () =>
                        Array.from({ length: startHour + 1 }, (_, i) => i),
                      disabledMinutes: (selectedHour) =>
                        selectedHour === startHour
                          ? Array.from({ length: startMinute + 1 }, (_, i) => i)
                          : [],
                    };
                  }}
                  style={{ width: "100%" }}
                />
              </Form.Item>
              {isDailyInvalid ? (
                <Text type="danger" style={{ fontSize: 12 }}>
                  Waktu selesai harus setelah waktu mulai.
                </Text>
              ) : null}
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                label="Status Publikasi"
                name="is_publish"
                valuePropName="checked"
                extra="Published akan tampil di halaman user. Draft disembunyikan."
              >
                <Switch checkedChildren="Published" unCheckedChildren="Draft" />
              </Form.Item>
            </Col>
          </Row>
        </>
      ) : (
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Tanggal Mulai"
              name="start_datetime"
              rules={[{ required: true }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Tanggal Selesai"
              name="end_datetime"
              rules={[{ required: true }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Status Publikasi"
              name="is_publish"
              valuePropName="checked"
              extra="Published akan tampil di halaman user. Draft disembunyikan."
            >
              <Switch checkedChildren="Published" unCheckedChildren="Draft" />
            </Form.Item>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default FlashSaleScheduleCard;

import React, { useMemo } from "react";
import {
  DatePicker,
  Divider,
  Image,
  Input,
  Modal,
  Space,
  Typography,
  Upload,
  message,
  Radio,
  theme,
} from "antd";
import { PictureOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { toWib } from "../../../../utils/timezone";

const { Text } = Typography;

type BannerFormState = {
  id: number | null;
  title: string;
  date: string;
  imageFile: File | null;
  imageUrl: string | null;
  imageType: "upload" | "link";
  imageLink: string;
  imageMobileFile: File | null;
  imageMobileUrl: string | null;
  imageMobileType: "upload" | "link";
  imageMobileLink: string;
};

type BannerModalProps = {
  open: boolean;
  form: BannerFormState;
  setForm: React.Dispatch<React.SetStateAction<BannerFormState>>;
  fileList: any[];
  setFileList: React.Dispatch<React.SetStateAction<any[]>>;
  mobileFileList: any[];
  setMobileFileList: React.Dispatch<React.SetStateAction<any[]>>;
  previewUrl: string;
  mobilePreviewUrl: string;
  allowedDates?: string[];
  onCancel: () => void;
  onOk: () => void;
};

const BannerModal: React.FC<BannerModalProps> = ({
  open,
  form,
  setForm,
  fileList,
  setFileList,
  mobileFileList,
  setMobileFileList,
  previewUrl,
  mobilePreviewUrl,
  allowedDates,
  onCancel,
  onOk,
}) => {
  const { token } = theme.useToken();
  const allowedDateSet = useMemo(() => {
    if (!allowedDates || allowedDates.length === 0) return null;
    return new Set(
      allowedDates
        .map((d) => toWib(d)?.format("YYYY-MM-DD"))
        .filter(Boolean),
    );
  }, [allowedDates]);

  const disableDate = (current: Dayjs) => {
    if (!allowedDateSet || !current) return false;
    const key = current.format("YYYY-MM-DD");
    return !allowedDateSet.has(key);
  };

  return (
    <Modal
      title={
        <Space>
          <PictureOutlined style={{ color: "var(--ant-primary-color)" }} />
          <span>{form.id ? "Edit Banner" : "Tambah Banner"}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText={form.id ? "Update" : "Simpan"}
      cancelText="Batal"
      width={500}
    >
      <Divider style={{ margin: "12px 0 20px 0" }} />
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div>
          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            Judul Banner <span style={{ color: "red" }}>*</span>
          </Text>
          <Input
            placeholder="Masukkan judul banner"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            style={{ borderRadius: 6 }}
          />
        </div>

        <div>
          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            Tanggal <span style={{ color: "red" }}>*</span>
          </Text>
          <DatePicker
            style={{ width: "100%", borderRadius: 6 }}
            placeholder="Pilih tanggal"
            value={form.date ? dayjs(form.date) : null}
            onChange={(date) =>
              setForm((prev) => ({
                ...prev,
                date: date ? date.format("YYYY-MM-DD") : "",
              }))
            }
            format="DD MMMM YYYY"
            disabledDate={disableDate}
          />
          {allowedDateSet && (
            <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: "block" }}>
              Tanggal banner harus sesuai dengan tanggal rekomendasi.
            </Text>
          )}
        </div>

        <div>
          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            Gambar Banner <span style={{ color: "red" }}>*</span>
          </Text>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
            Desktop: 1600×600 (rasio 16:6), safe area 10% kiri/kanan & 10% atas/bawah.
          </Text>
          <Radio.Group
            value={form.imageType}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                imageType: e.target.value,
                imageFile: e.target.value === "link" ? null : prev.imageFile,
                imageUrl: e.target.value === "link" ? null : prev.imageUrl,
                imageLink: e.target.value === "upload" ? "" : prev.imageLink,
              }))
            }
            style={{ marginBottom: 10 }}
          >
            <Radio value="upload">Upload Gambar</Radio>
            <Radio value="link">Gunakan Link</Radio>
          </Radio.Group>

          {form.imageType === "link" ? (
            <Input
              placeholder="https://example.com/banner.webp"
              value={form.imageLink}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, imageLink: e.target.value }))
              }
            />
          ) : (
            <>
              <Upload
                listType="picture-card"
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith("image/");
                  if (!isImage) {
                    message.error("Hanya file gambar yang diperbolehkan!");
                    return false;
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error("Ukuran gambar maksimal 2MB!");
                    return false;
                  }
                  setForm((prev) => ({ ...prev, imageFile: file as File }));
                  setFileList([file]);
                  return false;
                }}
                onRemove={() => {
                  setForm((prev) => ({ ...prev, imageFile: null }));
                  setFileList([]);
                }}
                fileList={fileList}
                maxCount={1}
              >
                {!fileList.length && !previewUrl && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8, fontSize: 12, color: token.colorText }}>Upload</div>
                  </div>
                )}
              </Upload>
              {previewUrl && !fileList.length ? (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
                    Preview Gambar Saat Ini:
                  </Text>
                  <Image src={previewUrl} style={{ borderRadius: 6, maxWidth: "100%" }} />
                </div>
              ) : null}
            </>
          )}
        </div>

        <div>
          <Text strong style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
            Gambar Banner Mobile <span style={{ color: "red" }}>*</span>
          </Text>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
            Mobile: 1080×810 (rasio 4:3), safe area 12% kiri/kanan & 10% atas/bawah.
          </Text>
          <Radio.Group
            value={form.imageMobileType}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                imageMobileType: e.target.value,
                imageMobileFile:
                  e.target.value === "link" ? null : prev.imageMobileFile,
                imageMobileUrl:
                  e.target.value === "link" ? null : prev.imageMobileUrl,
                imageMobileLink:
                  e.target.value === "upload" ? "" : prev.imageMobileLink,
              }))
            }
            style={{ marginBottom: 10 }}
          >
            <Radio value="upload">Upload Gambar</Radio>
            <Radio value="link">Gunakan Link</Radio>
          </Radio.Group>

          {form.imageMobileType === "link" ? (
            <Input
              placeholder="https://example.com/banner-mobile.webp"
              value={form.imageMobileLink}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  imageMobileLink: e.target.value,
                }))
              }
            />
          ) : (
            <>
              <Upload
                listType="picture-card"
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith("image/");
                  if (!isImage) {
                    message.error("Hanya file gambar yang diperbolehkan!");
                    return false;
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error("Ukuran gambar maksimal 2MB!");
                    return false;
                  }
                  setForm((prev) => ({
                    ...prev,
                    imageMobileFile: file as File,
                  }));
                  setMobileFileList([file]);
                  return false;
                }}
                onRemove={() => {
                  setForm((prev) => ({ ...prev, imageMobileFile: null }));
                  setMobileFileList([]);
                }}
                fileList={mobileFileList}
                maxCount={1}
              >
                {!mobileFileList.length && !mobilePreviewUrl && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8, fontSize: 12, color: token.colorText }}>Upload</div>
                  </div>
                )}
              </Upload>
              {mobilePreviewUrl && !mobileFileList.length ? (
                <div style={{ marginTop: 12 }}>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, display: "block", marginBottom: 6 }}
                  >
                    Preview Gambar Mobile Saat Ini:
                  </Text>
                  <Image
                    src={mobilePreviewUrl}
                    style={{ borderRadius: 6, maxWidth: "100%" }}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </Space>
    </Modal>
  );
};

export default BannerModal;

import moment from "moment-timezone";

export const WIB_TZ = "Asia/Jakarta";

const hasOffset = (value: string) => /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);

export const wibNow = () => moment.tz(WIB_TZ);

export const toWib = (value?: moment.MomentInput | null) => {
  if (value === null || value === undefined) return null;
  if (moment.isMoment(value)) return value.clone().tz(WIB_TZ);
  if (value instanceof Date) return moment(value).tz(WIB_TZ);
  if (typeof value === "string") {
    const m = hasOffset(value) ? moment(value) : moment.tz(value, WIB_TZ);
    return m.isValid() ? m.tz(WIB_TZ) : null;
  }
  const m = moment(value);
  return m.isValid() ? m.tz(WIB_TZ) : null;
};

export const formatWibDateTime = (
  value?: moment.MomentInput | null,
  format = "DD/MM/YYYY HH:mm",
) => {
  const m = toWib(value);
  return m ? m.format(format) : "-";
};

export const formatWibDate = (
  value?: moment.MomentInput | null,
  format = "DD/MM/YYYY",
) => {
  const m = toWib(value);
  return m ? m.format(format) : "-";
};

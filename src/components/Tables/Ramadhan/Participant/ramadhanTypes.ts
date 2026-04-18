// ramadanTypes.ts
export type RamadanParticipantRecord = {
  id: number | string;
  name: string;
  email?: string | null;
  phone_number?: string;
  address?: string | null;
  totalFasting: number;
  totalNotFasting: number;
  totalCheckin?: number;
  notFastingReasons?: string[];
  spinResult?: string;
};

export type QueryParams = {
  name?: string;
  sort_by?: string;
  direction?: "asc" | "desc";
  min_checkin?: number;
  has_prize?: number;
};

export type ColumnsCtx = {
  setOpen: (open: boolean) => void;
  setCurrent: (rec: RamadanParticipantRecord | false) => void;
  onInputPrize: (rec: RamadanParticipantRecord) => void;
  prizes: any[];
  selectedMilestones: { [key: number]: number | null };
};

export type PrizeSelection = {
  7: string | null;
  15: string | null;
  30: string | null;
};

export type StatsType = {
  totalParticipants: number;
  totalWith7Days: number;
  totalWith15Days: number;
  totalWith30Days: number;
};

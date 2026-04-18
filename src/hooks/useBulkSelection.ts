import { useState, type Key } from "react";
import type { TableRowSelection } from "antd/es/table/interface";

export const useBulkSelection = <T extends object>() => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const rowSelection: TableRowSelection<T> = {
    selectedRowKeys,
    onChange: (keys) => {
      setSelectedRowKeys(keys);
    },
  };

  const resetSelection = () => setSelectedRowKeys([]);

  const hasSelection = selectedRowKeys.length > 0;

  return {
    selectedRowKeys,
    rowSelection,
    resetSelection,
    hasSelection,
  };
};

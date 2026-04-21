import { useState } from 'react';
import { Plus } from 'lucide-react';

import { AppShell } from '@/layouts';
import { PageContainer, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  AdminDetailDialog,
  AdminFormDialog,
  AdminListTable,
} from '../components';
import { useAdmins } from '../hooks';
import { ADMIN_ROLE_OPTIONS, AdminRole } from '../types';
import type { Admin } from '../types';

const DEFAULT_PER_PAGE = 10;

const AdminListPage = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRole | 'all'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [target, setTarget] = useState<Admin | null>(null);

  const { data, isLoading, isError } = useAdmins({
    q: search.trim() || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    page,
    perPage,
  });

  const handleAdd = () => {
    setTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (admin: Admin) => {
    setTarget(admin);
    setFormOpen(true);
  };

  const handleView = (admin: Admin) => {
    setTarget(admin);
    setDetailOpen(true);
  };

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Admin Management"
          description={`Kelola user admin dan hak akses. ${data?.total ?? 0} total.`}
          actions={
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Tambah Admin
            </Button>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau email..."
            className="sm:max-w-sm"
          />
          <Select
            value={roleFilter === 'all' ? 'all' : String(roleFilter)}
            onValueChange={(v) => {
              setRoleFilter(v === 'all' ? 'all' : (Number(v) as AdminRole));
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Semua Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              {ADMIN_ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AdminListTable
          data={data?.data ?? []}
          total={data?.total ?? 0}
          isLoading={isLoading}
          isError={isError}
          page={page}
          perPage={perPage}
          onPaginationChange={({ page: p, perPage: pp }) => {
            setPage(p);
            setPerPage(pp);
          }}
          onEdit={handleEdit}
          onView={handleView}
        />

        <AdminFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setTarget(null);
          }}
          admin={target}
        />

        <AdminDetailDialog
          admin={target}
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setTarget(null);
          }}
        />
      </PageContainer>
    </AppShell>
  );
};

export default AdminListPage;

import { memo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Percent,
  Ticket,
  Zap,
  Users,
  Shield,
  Settings,
  BarChart3,
  ChevronDown,
  FileText,
  History,
  HelpCircle,
  ShoppingCart,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon?: LucideIcon;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    label: 'Catalog',
    icon: Package,
    items: [
      { label: 'Produk', path: '/products-new' },
      { label: 'Banner', path: '/banners-new' },
      { label: 'Home Banner Sections', path: '/home-banners-new' },
      { label: 'Brand', path: '/brands-new' },
      { label: 'Brand Logo Upload', path: '/brand-bulk-upload-logo-new' },
      { label: 'Brand Banner Upload', path: '/brand-bulk-upload-banner-new' },
      { label: 'Category Types', path: '/category-types-new' },
      { label: 'Tag', path: '/tags-new' },
      { label: 'Persona', path: '/personas-new' },
    ],
  },
  {
    label: 'Inventory',
    icon: Package,
    items: [
      { label: 'Stock Movement', path: '/stock-movements-new' },
      { label: 'Inventory Product', path: '/reports-new/inventory' },
    ],
  },
  {
    label: 'Master Data',
    icon: Package,
    items: [
      { label: 'Concern', path: '/concerns-new' },
      { label: 'Concern Options', path: '/concern-options-new' },
      { label: 'Profile Category', path: '/profile-categories-new' },
      { label: 'Profile Category Options', path: '/profile-category-options-new' },
    ],
  },
  {
    label: 'Picks',
    icon: Star,
    items: [
      { label: 'Abby Picks', path: '/abby-picks-new' },
      { label: 'Bev Picks', path: '/bev-picks-new' },
      { label: 'Top Picks Promo', path: '/top-picks-promo-new' },
    ],
  },
  {
    label: 'Marketing',
    icon: Percent,
    items: [
      { label: 'Diskon', path: '/discounts-new', icon: Percent },
      { label: 'Voucher', path: '/vouchers-new', icon: Ticket },
      { label: 'Flash Sale', path: '/flash-sales-new', icon: Zap },
      { label: 'Sale Promo', path: '/sales-new' },
      { label: 'B1G1', path: '/b1g1-new' },
      { label: 'Gift Products', path: '/gift-products-new' },
      { label: 'NED', path: '/ned-new' },
      { label: 'Referral Code', path: '/referral-codes-new' },
    ],
  },
  {
    label: 'Ramadan Event',
    icon: Zap,
    items: [
      { label: 'Spin Prizes', path: '/ramadan-spin-prizes-new' },
      { label: 'Recommendations', path: '/ramadan-recommendations-new' },
      { label: 'Banners', path: '/ramadan-banners-new' },
      { label: 'Participants', path: '/ramadan-participants-new' },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    items: [
      { label: 'Dashboard', path: '/reports-new/dashboard' },
      { label: 'Penjualan', path: '/reports-new/sales' },
      { label: 'Transaksi', path: '/reports-new/transaction' },
      { label: 'Pelanggan', path: '/reports-new/customer' },
      { label: 'Pendapatan', path: '/reports-new/revenue' },
      { label: 'Inventori', path: '/reports-new/inventory' },
      { label: 'SEO (Live)', path: '/seo-report-new' },
    ],
  },
  {
    label: 'Abeauties Squad',
    icon: Users,
    items: [{ label: 'Pendaftar', path: '/abeauties-squad-new' }],
  },
  {
    label: 'Transaksi',
    icon: ShoppingCart,
    items: [{ label: 'Transaksi', path: '/transactions-new' }],
  },
  {
    label: 'CRM',
    icon: Users,
    items: [
      { label: 'Customer', path: '/customers-new' },
      { label: 'Supabase Users', path: '/supabase-users-new' },
      { label: 'CRM Members', path: '/crm-members-new' },
      { label: 'CRM Affiliates', path: '/crm-affiliates-new' },
      { label: 'Abandoned Cart', path: '/abandoned-carts-new' },
    ],
  },
  {
    label: 'Content',
    icon: FileText,
    items: [
      { label: 'FAQ', path: '/faqs-new', icon: HelpCircle },
      { label: 'Privacy Policy', path: '/privacy-policy-new' },
      { label: 'Terms & Conditions', path: '/tnc-new' },
      { label: 'Return Policy', path: '/return-policy-new' },
      { label: 'About Us', path: '/about-us-new' },
      { label: 'Contact Us', path: '/contact-us-new' },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    items: [
      { label: 'Admin Management', path: '/admins-new', icon: Shield },
      { label: 'Settings', path: '/settings-new', icon: Settings },
      { label: 'Activity Log', path: '/activity-logs-new', icon: History },
    ],
  },
];

interface GroupBlockProps {
  group: NavGroup;
}

const GroupBlock = ({ group }: GroupBlockProps) => {
  const location = useLocation();
  const hasActiveChild = group.items.some((item) =>
    location.pathname.startsWith(item.path),
  );
  const [open, setOpen] = useState(hasActiveChild);
  const Icon = group.icon;
  const isSingle = group.items.length === 1 && group.items[0].path;

  if (isSingle) {
    const item = group.items[0];
    return (
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-foreground hover:bg-muted',
          )
        }
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {group.label}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', !open && '-rotate-90')}
        />
      </button>
      <div
        className={cn(
          'grid overflow-hidden transition-[grid-template-rows] duration-200 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0">
          <div className="ml-2 flex flex-col gap-0.5 border-l border-border pl-3 pt-1">
            {group.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted',
                    )
                  }
                >
                  {ItemIcon ? <ItemIcon className="h-3.5 w-3.5" /> : null}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarNavComponent = () => (
  <div className="flex flex-col gap-1">
    {NAV_GROUPS.map((group) => (
      <GroupBlock key={group.label} group={group} />
    ))}
  </div>
);

export const SidebarNav = memo(SidebarNavComponent);

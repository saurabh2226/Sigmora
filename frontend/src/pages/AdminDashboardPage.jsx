import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUsers, FiHome, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { fetchDashboardStats } from '../redux/slices/adminSlice';
import { updateProfile } from '../redux/slices/authSlice';
import { formatCurrency, formatDate } from '../utils/formatters';
import { STATUS_COLORS } from '../utils/constants';
import Loader from '../components/common/Loader/Loader';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const { stats, monthlyRevenue, recentBookings, loading } = useSelector(s => s.admin);
  const { user } = useSelector(s => s.auth);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatar: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);
  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    });
  }, [user?.name, user?.phone, user?.avatar]);
  if (loading && !stats) return <Loader fullPage />;

  const handleProfileSave = async (event) => {
    event.preventDefault();
    try {
      setSavingProfile(true);
      const result = await dispatch(updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        avatar: profileForm.avatar.trim(),
      }));

      if (result.meta.requestStatus === 'fulfilled') {
        toast.success('Admin profile updated');
      } else {
        toast.error(result.payload || 'Failed to update profile');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: <FiUsers />, color: '#6366f1' },
    { label: 'Total Hotels', value: stats?.totalHotels || 0, icon: <FiHome />, color: '#10b981' },
    { label: 'Total Bookings', value: stats?.totalBookings || 0, icon: <FiCalendar />, color: '#3b82f6' },
    { label: 'Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: <FiDollarSign />, color: '#f59e0b' },
  ];

  return (
    <div className="page container" style={{ paddingTop: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div><h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>Admin Dashboard</h1><p style={{ color: 'var(--color-text-muted)' }}>Overview of your platform</p></div>
        {/* <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/admin/community" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Community</Link>
          <Link to="/admin/reports" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Reports</Link>
          <Link to="/admin/hotels" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Hotels</Link>
          <Link to="/admin/users" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Users</Link>
          <Link to="/admin/bookings" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Bookings</Link>
          <Link to="/admin/reviews" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Reviews</Link>
          <Link to="/admin/offers" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Offers</Link>
          <Link to="/support" style={{ padding: '10px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>Support</Link>
        </div> */}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {statCards.map((c, i) => (
          <div key={i} style={{ padding: 'var(--space-6)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginBottom: 4 }}>{c.label}</p><p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: c.color }}>{c.value}</p></div>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: `${c.color}15`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Update Profile</h2>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Keep your admin contact details current for platform alerts and support escalations.</p>
        </div>
        <form onSubmit={handleProfileSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          <input
            style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-container-low)', color: 'var(--color-text-primary)' }}
            value={profileForm.name}
            onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Full name"
          />
          <input
            style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-container-low)', color: 'var(--color-text-primary)' }}
            value={profileForm.phone}
            onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))}
            placeholder="Phone number"
            inputMode="numeric"
          />
          <input
            style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-container-low)', color: 'var(--color-text-primary)' }}
            value={profileForm.avatar}
            onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))}
            placeholder="Avatar image URL"
          />
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={savingProfile} style={{ padding: '10px 22px', background: 'var(--gradient-primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>
              {savingProfile ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Recent Bookings</h2>
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['User', 'Hotel', 'Amount', 'Status', 'Date'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {recentBookings?.map(b => (
              <tr key={b._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px', fontSize: 'var(--font-size-sm)' }}>{b.user?.name || 'N/A'}</td>
                <td style={{ padding: '12px 16px', fontSize: 'var(--font-size-sm)' }}>{b.hotel?.title || 'N/A'}</td>
                <td style={{ padding: '12px 16px', fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(b.pricing?.totalPrice)}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'capitalize', background: `${STATUS_COLORS[b.status]}20`, color: STATUS_COLORS[b.status] }}>{b.status}</span></td>
                <td style={{ padding: '12px 16px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{formatDate(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

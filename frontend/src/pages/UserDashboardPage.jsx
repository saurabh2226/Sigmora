import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiSettings } from 'react-icons/fi';
import { fetchMyBookings, cancelBooking } from '../redux/slices/bookingSlice';
import { updateProfile } from '../redux/slices/authSlice';
import { formatCurrency, formatDate } from '../utils/formatters';
import { STATUS_COLORS } from '../utils/constants';
import { getImageUrl } from '../utils/helpers';
import Loader from '../components/common/Loader/Loader';
import ConfirmDialog from '../components/common/ConfirmDialog/ConfirmDialog';
import toast from 'react-hot-toast';

export default function UserDashboardPage() {
  const dispatch = useDispatch();
  const { bookings, loading, pagination } = useSelector(s => s.bookings);
  const { user } = useSelector(s => s.auth);
  const [tab, setTab] = useState('all');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatar: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [cancelBookingTarget, setCancelBookingTarget] = useState(null);

  useEffect(() => { dispatch(fetchMyBookings(tab === 'all' ? {} : { status: tab })); }, [dispatch, tab]);
  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    });
  }, [user?.name, user?.phone, user?.avatar]);

  const handleCancel = async () => {
    if (!cancelBookingTarget?._id) return;
    const result = await dispatch(cancelBooking({ id: cancelBookingTarget._id }));
    if (result.meta.requestStatus === 'fulfilled') {
      const refundAmount = result.payload?.refundAmount || 0;
      const refundStatus = result.payload?.refundStatus || result.payload?.booking?.payment?.refundStatus;
      toast.success(refundAmount > 0 && refundStatus === 'initiated'
        ? `Booking cancelled. Refund started for ${formatCurrency(refundAmount)}.`
        : refundAmount > 0
          ? `Booking cancelled. Refund updated for ${formatCurrency(refundAmount)}.`
          : 'Booking cancelled');
    }
    else toast.error(result.payload || 'Failed to cancel');
    setCancelBookingTarget(null);
  };

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
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.payload || 'Failed to update profile');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="page container" style={{ paddingTop: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>Welcome, {user?.name} 👋</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Manage your bookings and account</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Link to="/support" style={{ padding: '10px 20px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>Support Chat</Link>
          <Link to="/hotels" style={{ padding: '10px 24px', background: 'var(--gradient-primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 700 }}>Book New Stay</Link>
        </div>
      </div>

      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <FiSettings size={18} />
          <div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>Update Profile</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Keep your booking and receipt details current.</p>
          </div>
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

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {[
          { label: 'Total Bookings', value: pagination.total || bookings.length, color: '#6366f1' },
          { label: 'Upcoming', value: bookings.filter(b => b.status === 'confirmed').length, color: '#10b981' },
          { label: 'Completed', value: bookings.filter(b => b.status === 'checked-out').length, color: '#3b82f6' },
          { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} style={{ padding: 'var(--space-6)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
        {['all', 'confirmed', 'checked-out', 'cancelled', 'pending'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--font-size-sm)', textTransform: 'capitalize', background: tab === t ? 'var(--gradient-primary)' : 'transparent', color: tab === t ? 'white' : 'var(--color-text-secondary)', transition: 'all 0.2s' }}>{t}</button>
        ))}
      </div>

      {/* Booking List */}
      {loading ? <Loader /> : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-16)' }}><h3>No bookings found</h3><p style={{ color: 'var(--color-text-muted)' }}>Start by booking your first hotel</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {bookings.map(b => (
            <div key={b._id} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', transition: 'all 0.2s' }}>
              <img src={getImageUrl(b.hotel?.images)} alt={b.hotel?.title} style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{b.hotel?.title || 'Hotel'}</h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><FiMapPin size={12} /> {b.hotel?.address?.city}</p>
                  </div>
                  <span style={{ padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'capitalize', background: `${STATUS_COLORS[b.status]}20`, color: STATUS_COLORS[b.status] }}>{b.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  <span><FiCalendar size={12} style={{ marginRight: 4 }} /> {formatDate(b.checkIn)} — {formatDate(b.checkOut)}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(b.pricing?.totalPrice)}</span>
                </div>
                {b.status === 'pending' && b.holdExpiresAt ? (
                  <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    Room hold active until {new Date(b.holdExpiresAt).toLocaleString()}
                  </p>
                ) : null}
                {b.refundAmount > 0 ? (
                  <p style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 700 }}>
                    Refund {b.payment?.refundStatus === 'initiated' ? 'started' : 'tracked'}: {formatCurrency(b.refundAmount)}
                  </p>
                ) : null}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  <Link to={`/booking/confirmation/${b._id}`} style={{ padding: '6px 16px', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)' }}>View Details</Link>
                  {b.status === 'pending' || b.status === 'confirmed' ? <button onClick={() => setCancelBookingTarget(b)} style={{ padding: '6px 16px', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)' }}>Cancel</button> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={!!cancelBookingTarget}
        title="Cancel this booking?"
        description={cancelBookingTarget?.pricing?.totalPrice
          ? `This will cancel your stay${cancelBookingTarget.hotel?.title ? ` at ${cancelBookingTarget.hotel.title}` : ''}. If a refund applies, Sigmora will start it automatically and you’ll see the status in booking details.`
          : 'This will cancel your stay and release the room for other guests.'}
        confirmLabel="Yes, cancel booking"
        cancelLabel="Keep booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelBookingTarget(null)}
      />
    </div>
  );
}

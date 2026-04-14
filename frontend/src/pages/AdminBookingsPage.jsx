import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as bookingApi from '../api/bookingApi';
import { initiateRefund } from '../api/paymentApi';
import { BOOKING_STATUSES, STATUS_COLORS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import Loader from '../components/common/Loader/Loader';
import styles from './AdminWorkspace.module.css';

export default function AdminBookingsPage() {
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
  });
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [busyBookingId, setBusyBookingId] = useState('');
  const [statusDrafts, setStatusDrafts] = useState({});
  const [refundDialog, setRefundDialog] = useState({ open: false, booking: null, amount: '' });

  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data } = await bookingApi.getAllBookings({
        page: filters.page,
        limit: 12,
        status: filters.status || undefined,
      });
      setBookings(data.data.bookings);
      setPagination({
        page: data.data.currentPage,
        totalPages: data.data.totalPages,
        total: data.data.totalResults,
      });
      setStatusDrafts(Object.fromEntries(data.data.bookings.map((booking) => [booking._id, booking.status])));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [filters.page, filters.status]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bookings;
    return bookings.filter((booking) => {
      const haystack = [
        booking._id,
        booking.user?.name,
        booking.user?.email,
        booking.hotel?.title,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [bookings, search]);

  const handleStatusUpdate = async (bookingId) => {
    try {
      setBusyBookingId(bookingId);
      const status = statusDrafts[bookingId];
      await bookingApi.updateBookingStatus(bookingId, { status });
      await loadBookings();
      toast.success('Booking status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    } finally {
      setBusyBookingId('');
    }
  };

  const handleRefund = async (booking) => {
    const suggestedAmount = booking.refundAmount || booking.pricing?.totalPrice || 0;
    setRefundDialog({
      open: true,
      booking,
      amount: String(suggestedAmount),
    });
  };

  const confirmRefund = async () => {
    if (!refundDialog.booking) return;

    const numericAmount = Number(refundDialog.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Enter a valid refund amount');
      return;
    }

    try {
      setBusyBookingId(refundDialog.booking._id);
      await initiateRefund(refundDialog.booking._id, { amount: numericAmount });
      toast.success('Refund initiated');
      await loadBookings();
      setRefundDialog({ open: false, booking: null, amount: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate refund');
    } finally {
      setBusyBookingId('');
    }
  };

  return (
    <div className={`page container ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1>Manage Bookings</h1>
          <p>Track reservations, update booking lifecycle states, and issue Razorpay refunds when cancellations require it.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin" className={styles.secondaryBtn}>Back to Dashboard</Link>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <input
            className={styles.input}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ID, user, or hotel"
          />
          <select
            className={styles.select}
            value={filters.status}
            onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value, page: 1 }))}
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className={styles.cardGrid} style={{ marginBottom: 'var(--space-4)' }}>
          <div className={styles.metricCard}>
            <strong>{pagination.total}</strong>
            <span>Total bookings</span>
          </div>
          <div className={styles.metricCard}>
            <strong>{bookings.filter((booking) => booking.payment?.status === 'completed').length}</strong>
            <span>Paid on this page</span>
          </div>
          <div className={styles.metricCard}>
            <strong>{bookings.filter((booking) => booking.status === 'cancelled').length}</strong>
            <span>Cancelled on this page</span>
          </div>
        </div>

        {loading ? <Loader /> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Stay</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <strong>#{booking._id.slice(-6).toUpperCase()}</strong>
                      <div className={styles.metaText}>{booking.user?.name}</div>
                      <div className={styles.metaText}>{booking.user?.email}</div>
                    </td>
                    <td>
                      <strong>{booking.hotel?.title || 'Hotel removed'}</strong>
                      <div className={styles.metaText}>{formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</div>
                    </td>
                    <td>
                      <strong>{formatCurrency(booking.pricing?.totalPrice || 0)}</strong>
                      <div className={styles.metaText}>Refundable {formatCurrency(booking.refundAmount || 0)}</div>
                      {booking.payment?.refundStatus === 'initiated' && (
                        <div className={styles.metaText}>Refund initiated, awaiting completion</div>
                      )}
                    </td>
                    <td>
                      <span
                        className={styles.pill}
                        style={{
                          background: booking.payment?.status === 'completed'
                            ? 'rgba(16,185,129,0.12)'
                            : ['refunded', 'partial_refunded'].includes(booking.payment?.status)
                              ? 'rgba(59,130,246,0.12)'
                              : 'rgba(245,158,11,0.12)',
                          color: booking.payment?.status === 'completed'
                            ? '#10b981'
                            : ['refunded', 'partial_refunded'].includes(booking.payment?.status)
                              ? '#3b82f6'
                              : '#d97706',
                        }}
                      >
                        {booking.payment?.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={styles.pill}
                        style={{
                          background: `${STATUS_COLORS[booking.status] || '#6366f1'}20`,
                          color: STATUS_COLORS[booking.status] || '#6366f1',
                        }}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.stack}>
                        <select
                          className={styles.select}
                          value={statusDrafts[booking._id] || booking.status}
                          disabled={booking.status === 'checked-out' || busyBookingId === booking._id}
                          onChange={(e) => setStatusDrafts((current) => ({ ...current, [booking._id]: e.target.value }))}
                        >
                          {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <div className={styles.inlineActions}>
                          {booking.status !== 'checked-out' && (statusDrafts[booking._id] || booking.status) !== booking.status && (
                            <button
                              type="button"
                              className={styles.primaryBtn}
                              disabled={busyBookingId === booking._id}
                              onClick={() => handleStatusUpdate(booking._id)}
                            >
                              {busyBookingId === booking._id ? 'Saving...' : 'Save'}
                            </button>
                          )}
                          {booking.payment?.status === 'completed' && (
                            <button
                              type="button"
                              className={styles.secondaryBtn}
                              disabled={busyBookingId === booking._id}
                              onClick={() => handleRefund(booking)}
                            >
                              {booking.payment?.refundStatus === 'initiated' ? 'Complete refund' : 'Refund'}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className={styles.emptyState}>No bookings match the current search.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.inlineActions} style={{ marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={filters.page <= 1}
            onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
          >
            Previous
          </button>
          <span className={styles.metaText}>Page {pagination.page} of {pagination.totalPages || 1}</span>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={filters.page >= pagination.totalPages}
            onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
          >
            Next
          </button>
        </div>
      </div>
      {refundDialog.open && (
        <div className={styles.dialogOverlay} role="presentation" onClick={() => setRefundDialog({ open: false, booking: null, amount: '' })}>
          <div className={styles.dialogCard} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h3>Confirm refund</h3>
            <p>
              Start a Razorpay refund for <strong>{refundDialog.booking?.hotel?.title}</strong>. This action will email the guest once the refund is initiated.
            </p>
            <label className={styles.label}>Refund amount (INR)</label>
            <input
              className={styles.input}
              type="number"
              min="1"
              value={refundDialog.amount}
              onChange={(event) => setRefundDialog((current) => ({ ...current, amount: event.target.value }))}
            />
            <div className={styles.inlineActions} style={{ justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setRefundDialog({ open: false, booking: null, amount: '' })}>Cancel</button>
              <button type="button" className={styles.primaryBtn} onClick={confirmRefund} disabled={busyBookingId === refundDialog.booking?._id}>
                {busyBookingId === refundDialog.booking?._id ? 'Refunding...' : 'Confirm refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as hotelApi from '../api/hotelApi';
import { AMENITIES, HOTEL_TYPES, ROOM_TYPES } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';
import { getImageUrl } from '../utils/helpers';
import Loader from '../components/common/Loader/Loader';
import styles from './AdminWorkspace.module.css';

const EMPTY_FORM = {
  id: '',
  title: '',
  description: '',
  type: 'hotel',
  street: '',
  city: '',
  state: '',
  country: 'India',
  zipCode: '',
  pricePerNight: '',
  maxGuests: 2,
  totalRooms: 1,
  isFeatured: false,
  amenities: [],
  latitude: '',
  longitude: '',
  createStarterRoom: true,
  roomTitle: '',
  roomType: 'double',
  roomPricePerNight: '',
  roomMaxGuests: 2,
  roomTotalRooms: 1,
  roomBedType: 'queen',
  roomSize: '',
  roomAmenitiesInput: '',
};

const toHotelPayload = (form) => {
  const coordinates = {};
  if (form.latitude !== '') coordinates.lat = Number(form.latitude);
  if (form.longitude !== '') coordinates.lng = Number(form.longitude);

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    type: form.type,
    address: {
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim() || 'India',
      zipCode: form.zipCode.trim(),
      ...(Object.keys(coordinates).length > 0 ? { coordinates } : {}),
    },
    pricePerNight: Number(form.pricePerNight),
    maxGuests: Number(form.maxGuests),
    totalRooms: Number(form.totalRooms),
    isFeatured: form.isFeatured,
    amenities: form.amenities,
  };
};

const toStarterRoomPayload = (form) => ({
  title: form.roomTitle.trim() || `${form.title.trim()} Standard Room`,
  type: form.roomType,
  pricePerNight: Number(form.roomPricePerNight || form.pricePerNight),
  maxGuests: Number(form.roomMaxGuests || form.maxGuests),
  totalRooms: Number(form.roomTotalRooms || form.totalRooms),
  bedType: form.roomBedType,
  roomSize: form.roomSize ? Number(form.roomSize) : undefined,
  amenities: form.roomAmenitiesInput
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
});

const mapHotelToForm = (hotel) => ({
  ...EMPTY_FORM,
  id: hotel._id,
  title: hotel.title || '',
  description: hotel.description || '',
  type: hotel.type || 'hotel',
  street: hotel.address?.street || '',
  city: hotel.address?.city || '',
  state: hotel.address?.state || '',
  country: hotel.address?.country || 'India',
  zipCode: hotel.address?.zipCode || '',
  pricePerNight: hotel.pricePerNight || '',
  maxGuests: hotel.maxGuests || 2,
  totalRooms: hotel.totalRooms || 1,
  isFeatured: !!hotel.isFeatured,
  amenities: hotel.amenities || [],
  latitude: hotel.address?.coordinates?.lat ?? '',
  longitude: hotel.address?.coordinates?.lng ?? '',
  createStarterRoom: false,
});

export default function AdminHotelsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const { data } = await hotelApi.getManagedHotels();
      setHotels(data.data.hotels);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const filteredHotels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return hotels;
    return hotels.filter((hotel) => {
      const haystack = [
        hotel.title,
        hotel.type,
        hotel.address?.city,
        hotel.address?.state,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [hotels, search]);

  const handleAmenityToggle = (amenity) => {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const handleEdit = (hotel) => {
    setForm(mapHotelToForm(hotel));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
  };

  const handleDelete = async (hotelId) => {
    if (!window.confirm('Delete this hotel from active listings?')) return;

    try {
      await hotelApi.deleteHotel(hotelId);
      toast.success('Hotel removed from active listings');
      await loadHotels();
      if (form.id === hotelId) {
        handleReset();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete hotel');
    }
  };

  const resetRoomDraft = () => {
    setForm((current) => ({
      ...current,
      roomTitle: '',
      roomType: 'double',
      roomPricePerNight: '',
      roomMaxGuests: current.maxGuests || 2,
      roomTotalRooms: 1,
      roomBedType: 'queen',
      roomSize: '',
      roomAmenitiesInput: '',
    }));
  };

  const handleAddRoomToHotel = async () => {
    if (!form.id) {
      toast.error('Save the hotel first before adding rooms');
      return;
    }

    try {
      setSaving(true);
      await hotelApi.createRoom(form.id, toStarterRoomPayload(form));
      toast.success('Room added successfully');
      await loadHotels();
      resetRoomDraft();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add room');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = toHotelPayload(form);
      let hotelId = form.id;

      if (form.id) {
        await hotelApi.updateHotel(form.id, payload);
        toast.success('Hotel updated successfully');
      } else {
        const { data } = await hotelApi.createHotel(payload);
        hotelId = data.data.hotel._id;
        if (form.createStarterRoom) {
          await hotelApi.createRoom(hotelId, toStarterRoomPayload(form));
        }
        toast.success('Hotel created successfully');
      }

      await loadHotels();
      handleReset();

      if (!form.id && !hotelId) {
        toast.success('Create a room inventory next to make it bookable');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save hotel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`page container ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1>Manage Hotels</h1>
          <p>Create, update, feature, and retire hotel listings. New properties can optionally create a starter room so they are immediately bookable.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin" className={styles.secondaryBtn}>Back to Dashboard</Link>
          <button type="button" className={styles.ghostBtn} onClick={handleReset}>New Hotel Form</button>
        </div>
      </div>

      <div className={styles.gridTwo}>
        <section className={styles.panel}>
          <form className={styles.stack} onSubmit={handleSubmit}>
            <div>
              <label className={styles.label}>Hotel Title</label>
              <input className={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="The Marigold Suites" required />
            </div>

            <div className={styles.formGrid}>
              <div>
                <label className={styles.label}>Property Type</label>
                <select className={styles.select} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {HOTEL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className={styles.label}>Base Price Per Night</label>
                <input className={styles.input} type="number" min="100" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} required />
              </div>
              <div>
                <label className={styles.label}>Max Guests</label>
                <input className={styles.input} type="number" min="1" value={form.maxGuests} onChange={(e) => setForm({ ...form, maxGuests: e.target.value })} required />
              </div>
              <div>
                <label className={styles.label}>Total Rooms</label>
                <input className={styles.input} type="number" min="1" value={form.totalRooms} onChange={(e) => setForm({ ...form, totalRooms: e.target.value })} required />
              </div>
            </div>

            <div className={styles.formGrid}>
              <div>
                <label className={styles.label}>Street</label>
                <input className={styles.input} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Near MG Road" />
              </div>
              <div>
                <label className={styles.label}>City</label>
                <input className={styles.input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </div>
              <div>
                <label className={styles.label}>State</label>
                <input className={styles.input} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
              </div>
              <div>
                <label className={styles.label}>Country</label>
                <input className={styles.input} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
              <div>
                <label className={styles.label}>Latitude</label>
                <input className={styles.input} type="number" step="0.000001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </div>
              <div>
                <label className={styles.label}>Longitude</label>
                <input className={styles.input} type="number" step="0.000001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </div>
            </div>

            <div>
              <label className={styles.label}>Description</label>
              <textarea className={styles.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the vibe, location, and guest experience..." required />
            </div>

            <div>
              <label className={styles.label}>Amenities</label>
              <div className={styles.checkboxGrid}>
                {AMENITIES.map((amenity) => (
                  <label key={amenity} className={styles.checkboxItem}>
                    <input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => handleAmenityToggle(amenity)} />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {!form.id && (
              <div className={styles.panel}>
                <label className={styles.checkboxItem}>
                  <input type="checkbox" checked={form.createStarterRoom} onChange={(e) => setForm({ ...form, createStarterRoom: e.target.checked })} />
                  <span>Create a starter room for this hotel</span>
                </label>
                <p className={styles.hint}>This helps new hotels become bookable immediately after creation.</p>
                {form.createStarterRoom && (
                  <div className={styles.stack} style={{ marginTop: 'var(--space-4)' }}>
                    <div className={styles.formGrid}>
                      <div>
                        <label className={styles.label}>Room Title</label>
                        <input className={styles.input} value={form.roomTitle} onChange={(e) => setForm({ ...form, roomTitle: e.target.value })} placeholder="Deluxe King Room" />
                      </div>
                      <div>
                        <label className={styles.label}>Room Type</label>
                        <select className={styles.select} value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
                          {ROOM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={styles.label}>Room Price</label>
                        <input className={styles.input} type="number" min="100" value={form.roomPricePerNight} onChange={(e) => setForm({ ...form, roomPricePerNight: e.target.value })} placeholder="Defaults to hotel base price" />
                      </div>
                      <div>
                        <label className={styles.label}>Room Max Guests</label>
                        <input className={styles.input} type="number" min="1" value={form.roomMaxGuests} onChange={(e) => setForm({ ...form, roomMaxGuests: e.target.value })} />
                      </div>
                      <div>
                        <label className={styles.label}>Inventory Count</label>
                        <input className={styles.input} type="number" min="1" value={form.roomTotalRooms} onChange={(e) => setForm({ ...form, roomTotalRooms: e.target.value })} />
                      </div>
                      <div>
                        <label className={styles.label}>Room Size (sq ft)</label>
                        <input className={styles.input} type="number" min="50" value={form.roomSize} onChange={(e) => setForm({ ...form, roomSize: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className={styles.label}>Room Amenities</label>
                      <input className={styles.input} value={form.roomAmenitiesInput} onChange={(e) => setForm({ ...form, roomAmenitiesInput: e.target.value })} placeholder="wifi, breakfast, ac, smart-tv" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {form.id && (
              <div className={styles.panel}>
                <p className={styles.hint}>Add a new room to this hotel. Public hotel cards and prices now refresh automatically after room changes.</p>
                <div className={styles.stack} style={{ marginTop: 'var(--space-4)' }}>
                  <div className={styles.formGrid}>
                    <div>
                      <label className={styles.label}>Room Title</label>
                      <input className={styles.input} value={form.roomTitle} onChange={(e) => setForm({ ...form, roomTitle: e.target.value })} placeholder="Premium Balcony Room" />
                    </div>
                    <div>
                      <label className={styles.label}>Room Type</label>
                      <select className={styles.select} value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })}>
                        {ROOM_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={styles.label}>Room Price</label>
                      <input className={styles.input} type="number" min="100" value={form.roomPricePerNight} onChange={(e) => setForm({ ...form, roomPricePerNight: e.target.value })} placeholder="Defaults to hotel base price" />
                    </div>
                    <div>
                      <label className={styles.label}>Room Max Guests</label>
                      <input className={styles.input} type="number" min="1" value={form.roomMaxGuests} onChange={(e) => setForm({ ...form, roomMaxGuests: e.target.value })} />
                    </div>
                    <div>
                      <label className={styles.label}>Inventory Count</label>
                      <input className={styles.input} type="number" min="1" value={form.roomTotalRooms} onChange={(e) => setForm({ ...form, roomTotalRooms: e.target.value })} />
                    </div>
                    <div>
                      <label className={styles.label}>Room Size (sq ft)</label>
                      <input className={styles.input} type="number" min="50" value={form.roomSize} onChange={(e) => setForm({ ...form, roomSize: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={styles.label}>Room Amenities</label>
                    <input className={styles.input} value={form.roomAmenitiesInput} onChange={(e) => setForm({ ...form, roomAmenitiesInput: e.target.value })} placeholder="wifi, breakfast, ac, smart-tv" />
                  </div>
                  <div className={styles.inlineActions}>
                    <button type="button" className={styles.primaryBtn} onClick={handleAddRoomToHotel} disabled={saving}>
                      {saving ? 'Saving...' : 'Add Room'}
                    </button>
                    <button type="button" className={styles.secondaryBtn} onClick={resetRoomDraft}>Clear Room Draft</button>
                  </div>
                </div>
              </div>
            )}

            <label className={styles.checkboxItem}>
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              <span>Show this hotel in featured sections</span>
            </label>

            <div className={styles.inlineActions}>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Update Hotel' : 'Create Hotel'}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleReset}>Reset</button>
            </div>
          </form>
        </section>

        <section className={styles.stack}>
          <div className={styles.panel}>
            <div className={styles.toolbar}>
              <input className={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by hotel, city, or type" />
            </div>
            <div className={styles.cardGrid}>
              <div className={styles.metricCard}>
                <strong>{hotels.length}</strong>
                <span>Active hotels</span>
              </div>
              <div className={styles.metricCard}>
                <strong>{hotels.filter((hotel) => hotel.isFeatured).length}</strong>
                <span>Featured listings</span>
              </div>
              <div className={styles.metricCard}>
                <strong>{formatCurrency(hotels.reduce((sum, hotel) => sum + (hotel.pricePerNight || 0), 0) / Math.max(hotels.length, 1))}</strong>
                <span>Average nightly price</span>
              </div>
            </div>
          </div>

          <div className={styles.stack}>
            {loading ? <Loader /> : filteredHotels.length === 0 ? (
              <div className={styles.emptyState}>No hotels match your current search.</div>
            ) : filteredHotels.map((hotel) => (
              <article key={hotel._id} className={styles.hotelCard}>
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                  <img
                    src={getImageUrl(hotel.images)}
                    alt={hotel.title}
                    style={{ width: 96, height: 96, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                      <div>
                        <h3>{hotel.title}</h3>
                        <p className={styles.metaText}>{hotel.address?.city}, {hotel.address?.state}</p>
                      </div>
                      <span className={styles.pill} style={{ background: hotel.isFeatured ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)', color: hotel.isFeatured ? '#d97706' : '#6366f1' }}>
                        {hotel.isFeatured ? 'Featured' : hotel.type}
                      </span>
                    </div>
                    <div className={styles.tagRow}>
                      <span className={styles.tag}>{formatCurrency(hotel.pricePerNight)} / night</span>
                      <span className={styles.tag}>{hotel.totalRooms} rooms</span>
                      <span className={styles.tag}>Rating {hotel.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className={styles.inlineActions} style={{ marginTop: 'var(--space-4)' }}>
                      <button type="button" className={styles.primaryBtn} onClick={() => handleEdit(hotel)}>Edit</button>
                      <button type="button" className={styles.dangerBtn} onClick={() => handleDelete(hotel._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

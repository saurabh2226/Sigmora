import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as hotelApi from '../api/hotelApi';
import { AMENITIES, HOTEL_TYPES, ROOM_TYPES } from '../utils/constants';
import { formatCurrency } from '../utils/formatters';
import { getImageUrl } from '../utils/helpers';
import Loader from '../components/common/Loader/Loader';
import styles from './AdminWorkspace.module.css';

const HOTELS_PER_PAGE = 6;

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

const validateRoomDraft = (form) => {
  if (!form.roomPricePerNight && !form.pricePerNight) return 'Add a room price before saving';
  if (Number(form.roomPricePerNight || form.pricePerNight) < 100) return 'Room price must be at least ₹100';
  if (Number(form.roomMaxGuests || form.maxGuests) < 1) return 'Room max guests must be at least 1';
  if (Number(form.roomTotalRooms || form.totalRooms || 0) < 1) return 'Inventory count must be at least 1';
  if (form.roomSize && Number(form.roomSize) < 10) return 'Room size must be at least 10 sq ft';
  return '';
};

const validateHotelForm = (form) => {
  if (!form.title.trim() || form.title.trim().length < 3) return 'Hotel title must be at least 3 characters';
  if (!form.description.trim() || form.description.trim().length < 10) return 'Description must be at least 10 characters';
  if (!form.city.trim()) return 'City is required';
  if (!form.state.trim()) return 'State is required';
  if (!form.country.trim()) return 'Country is required';
  if (form.zipCode && !/^[1-9][0-9]{5}$/.test(form.zipCode.trim())) return 'Enter a valid 6-digit PIN code';
  if (!Number.isFinite(Number(form.pricePerNight)) || Number(form.pricePerNight) < 100) return 'Base price must be at least ₹100';
  if (!Number.isFinite(Number(form.maxGuests)) || Number(form.maxGuests) < 1) return 'Max guests must be at least 1';
  if (!Number.isFinite(Number(form.totalRooms)) || Number(form.totalRooms) < 1) return 'Total rooms must be at least 1';

  const hasLatitude = String(form.latitude).trim() !== '';
  const hasLongitude = String(form.longitude).trim() !== '';
  if (hasLatitude !== hasLongitude) return 'Add both latitude and longitude, or leave both blank';

  return '';
};

export default function AdminHotelsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hotelPage, setHotelPage] = useState(1);
  const [imageFiles, setImageFiles] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const loadHotels = async () => {
    try {
      setLoading(true);
      const { data } = await hotelApi.getManagedHotels();
      const hydratedHotels = await Promise.all((data.data.hotels || []).map(async (hotel) => {
        try {
          const { data: roomsData } = await hotelApi.getRooms(hotel._id);
          return {
            ...hotel,
            rooms: roomsData.data.rooms || [],
          };
        } catch (error) {
          return {
            ...hotel,
            rooms: [],
          };
        }
      }));
      setHotels(hydratedHotels);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  useEffect(() => {
    setHotelPage(1);
  }, [search]);

  const filteredHotels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return hotels;
    return hotels.filter((hotel) => {
      const haystack = [
        hotel.title,
        hotel.type,
        hotel.address?.city,
        hotel.address?.state,
        ...(hotel.rooms || []).map((room) => room.title),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [hotels, search]);

  const paginatedHotels = useMemo(() => {
    const startIndex = (hotelPage - 1) * HOTELS_PER_PAGE;
    return filteredHotels.slice(startIndex, startIndex + HOTELS_PER_PAGE);
  }, [filteredHotels, hotelPage]);

  const totalHotelPages = Math.max(1, Math.ceil(filteredHotels.length / HOTELS_PER_PAGE));

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
    setImageFiles([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setShowForm(false);
  };

  const handleCreateNew = () => {
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadSelectedImages = async (hotelId) => {
    if (!imageFiles.length) {
      return;
    }

    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    await hotelApi.uploadHotelImages(hotelId, formData);
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

    const roomError = validateRoomDraft(form);
    if (roomError) {
      toast.error(roomError);
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

    const hotelError = validateHotelForm(form);
    if (hotelError) {
      toast.error(hotelError);
      return;
    }

    try {
      setSaving(true);
      const payload = toHotelPayload(form);
      let hotelId = form.id;

      if (form.id) {
        await hotelApi.updateHotel(form.id, payload);
        hotelId = form.id;
        toast.success('Hotel updated successfully');
      } else {
        const { data } = await hotelApi.createHotel(payload);
        hotelId = data.data.hotel._id;
        if (form.createStarterRoom) {
          const roomError = validateRoomDraft(form);
          if (roomError) {
            throw new Error(roomError);
          }
          await hotelApi.createRoom(hotelId, toStarterRoomPayload(form));
        }
        toast.success('Hotel created successfully');
      }

      if (hotelId && imageFiles.length > 0) {
        await uploadSelectedImages(hotelId);
      }

      await loadHotels();
      setShowForm(false);
      setForm(EMPTY_FORM);
      setImageFiles([]);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to save hotel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`page container ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1>Manage Hotels</h1>
          <p>Create, update, feature, and retire hotel listings. You can now upload hotel images directly here and review room inventory below every hotel card.</p>
        </div>
        <div className={styles.actions}>
          <Link to="/admin" className={styles.secondaryBtn}>Back to Dashboard</Link>
          <button type="button" className={styles.ghostBtn} onClick={handleCreateNew}>Create New Hotel</button>
        </div>
      </div>

      {showForm && (
      <section className={styles.panel}>
        <div className={styles.header} style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-xl)' }}>{form.id ? 'Edit Hotel' : 'Add Hotel'}</h1>
            <p>Keep the hotel form focused here, then manage the full hotel list below with cleaner pagination.</p>
          </div>
        </div>

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
              <label className={styles.label}>PIN Code</label>
              <input className={styles.input} value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="313001" />
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
            <label className={styles.label}>Hotel Images</label>
            <input className={styles.input} type="file" accept="image/*" multiple onChange={(event) => setImageFiles(Array.from(event.target.files || []))} />
            <div className={styles.hint}>{imageFiles.length > 0 ? `${imageFiles.length} image${imageFiles.length === 1 ? '' : 's'} ready to upload` : 'Select one or more images to show the real property photo to users.'}</div>
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
                      <input className={styles.input} type="number" min="10" value={form.roomSize} onChange={(e) => setForm({ ...form, roomSize: e.target.value })} />
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
              <p className={styles.hint}>Add a new room to this hotel. Validation runs before save so empty or invalid room drafts won’t silently fail.</p>
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
                    <input className={styles.input} type="number" min="10" value={form.roomSize} onChange={(e) => setForm({ ...form, roomSize: e.target.value })} />
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
      )}

      <section className={styles.stack} style={{ marginTop: 'var(--space-6)' }}>
        <div className={styles.panel}>
          <div className={styles.toolbar}>
            <input className={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by hotel, city, type, or room title" />
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

        {loading ? <Loader /> : paginatedHotels.length === 0 ? (
          <div className={styles.emptyState}>No hotels match your current search.</div>
        ) : paginatedHotels.map((hotel) => (
          <article key={hotel._id} className={styles.hotelCard}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img
                src={getImageUrl(hotel.images)}
                alt={hotel.title}
                style={{ width: 112, height: 112, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 260 }}>
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
                  <span className={styles.tag}>{hotel.rooms?.length || 0} room type{(hotel.rooms?.length || 0) === 1 ? '' : 's'}</span>
                </div>
                {hotel.rooms?.length > 0 && (
                  <div className={styles.tagRow} style={{ marginTop: 'var(--space-3)' }}>
                    {hotel.rooms.slice(0, 4).map((room) => (
                      <span key={room._id} className={styles.tag}>{room.title}</span>
                    ))}
                    {hotel.rooms.length > 4 && <span className={styles.tag}>+{hotel.rooms.length - 4} more</span>}
                  </div>
                )}
                <div className={styles.inlineActions} style={{ marginTop: 'var(--space-4)' }}>
                  <button type="button" className={styles.primaryBtn} onClick={() => handleEdit(hotel)}>Edit</button>
                  <button type="button" className={styles.dangerBtn} onClick={() => handleDelete(hotel._id)}>Delete</button>
                </div>
              </div>
            </div>
          </article>
        ))}

        <div className={styles.inlineActions} style={{ justifyContent: 'space-between' }}>
          <button type="button" className={styles.secondaryBtn} disabled={hotelPage <= 1} onClick={() => setHotelPage((current) => current - 1)}>Previous</button>
          <span className={styles.metaText}>Page {hotelPage} of {totalHotelPages}</span>
          <button type="button" className={styles.secondaryBtn} disabled={hotelPage >= totalHotelPages} onClick={() => setHotelPage((current) => current + 1)}>Next</button>
        </div>
      </section>
    </div>
  );
}

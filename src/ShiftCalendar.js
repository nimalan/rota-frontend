import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/en-gb';
import axios from 'axios';
import Modal from 'react-modal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('en-gb');
const DraggableCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

const API_URL = 'https://my-rota-api.onrender.com'; // Replace if needed

Modal.setAppElement('#root');

function ShiftCalendar({ loggedInUser }) {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);

  // Modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftDate, setShiftDate] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState(1);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const formatEvent = useCallback((eventData) => {
    return {
      id: `shift-${eventData.id}`,
      title: eventData.user ? eventData.user.username : 'Unassigned',
      start: new Date(eventData.start_time), // stored as UTC, will be converted by Date()
      end: new Date(eventData.end_time),
      userId: eventData.user_id,
      recurring_shift_id: eventData.recurring_shift_id,
      isHoliday: false,
    };
  }, []);

  const fetchAllEvents = useCallback(() => {
    const now = moment();
    const startDate = now.clone().startOf('month').toISOString();
    const endDate = now.clone().add(2, 'months').endOf('month').toISOString();

    axios
      .get(`${API_URL}/shifts?start_date=${startDate}&end_date=${endDate}`)
      .then((res) => {
        const formatted = res.data.map(formatEvent);
        setEvents(formatted);
      })
      .catch((err) => console.error('Error fetching shifts:', err));
  }, [formatEvent]);

  const fetchUsers = () => {
    axios
      .get(`${API_URL}/users`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error('Error fetching users:', err));
  };

  useEffect(() => {
    fetchUsers();
    fetchAllEvents();
  }, [fetchAllEvents]);

  const createPayload = () => ({
    start_time: moment.utc(`${shiftDate}T${shiftStartTime}`).toISOString(),
    end_time: moment.utc(`${shiftDate}T${shiftEndTime}`).toISOString(),
    user_id: selectedUserId ? parseInt(selectedUserId) : null,
  });

  const handleSave = () => {
    const payload = {
      ...createPayload(),
      is_recurring: isRecurring,
      recurrence_months: recurrenceMonths,
    };
    axios
      .post(`${API_URL}/shifts`, payload)
      .then(() => {
        fetchAllEvents();
        closeModal();
      })
      .catch((err) => {
        console.error('Error saving shift', err);
        alert('Could not save shift.');
      });
  };

  const handleSelectSlot = ({ start }) => {
    setShiftDate(moment(start).format('YYYY-MM-DD'));
    setShiftStartTime('09:00');
    setShiftEndTime('17:00');
    openModal();
  };

  const handleEventDrop = ({ event, start, end }) => {
    const payload = {
      start_time: moment(start).utc().toISOString(),
      end_time: moment(end).utc().toISOString(),
      user_id: event.userId,
    };

    const shiftId = event.id.replace('shift-', '');
    axios
      .put(`${API_URL}/shifts/${shiftId}`, payload)
      .then(() => fetchAllEvents())
      .catch((err) => {
        console.error('Error updating shift', err);
        alert('Could not update shift.');
      });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Shift Calendar</h2>

      <DraggableCalendar
        localizer={localizer}
        events={events}
        defaultView="week"
        selectable
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        resizable
        onEventResize={handleEventDrop}
        style={{ height: '80vh' }}
        popup
      />

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Shift Modal"
        className="bg-white p-6 rounded-lg max-w-md mx-auto mt-12 shadow-xl"
      >
        <h3 className="text-lg font-semibold mb-4">Create Shift</h3>

        <div className="mb-2">
          <label className="block font-medium">Date</label>
          <input
            type="date"
            value={shiftDate}
            onChange={(e) => setShiftDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-2">
          <label className="block font-medium">Start Time</label>
          <input
            type="time"
            value={shiftStartTime}
            onChange={(e) => setShiftStartTime(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-2">
          <label className="block font-medium">End Time</label>
          <input
            type="time"
            value={shiftEndTime}
            onChange={(e) => setShiftEndTime(e.target.value)}
            className="border p-2 w-full"
          />
        </div>

        <div className="mb-2">
          <label className="block font-medium">Assign User</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="border p-2 w-full"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            Repeat weekly for:
          </label>
          {isRecurring && (
            <input
              type="number"
              min={1}
              value={recurrenceMonths}
              onChange={(e) => setRecurrenceMonths(Number(e.target.value))}
              className="border p-1 w-16 ml-2"
            />
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ShiftCalendar;

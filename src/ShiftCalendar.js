import React, { useState, useEffect, useCallback } from 'react';
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
const API_URL = 'https://my-rota-api.onrender.com';

Modal.setAppElement('#root');

function ShiftCalendar({ loggedInUser }) {
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [shiftDate, setShiftDate] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState(1);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [applyToAll, setApplyToAll] = useState(false);

  const closeModal = () => {
    setModalIsOpen(false);
    setShiftDate('');
    setShiftStartTime('');
    setShiftEndTime('');
    setSelectedUserId('');
    setIsRecurring(false);
    setRecurrenceMonths(1);
    setEditingShiftId(null);
    setApplyToAll(false);
  };

  const openModal = (date) => {
    setShiftDate(moment(date).format('YYYY-MM-DD'));
    setModalIsOpen(true);
  };

  const openEditModal = (event) => {
    setShiftDate(moment(event.start).format('YYYY-MM-DD'));
    setShiftStartTime(moment(event.start).format('HH:mm'));
    setShiftEndTime(moment(event.end).format('HH:mm'));
    setSelectedUserId(event.userId);
    setEditingShiftId(event.id.replace('shift-', ''));
    setApplyToAll(false);
    setModalIsOpen(true);
  };

  const formatEvent = useCallback((eventData) => {
    const colorIndex = eventData.user_id % 6;
    const colors = ['#E27D60', '#85DCB0', '#E8A87C', '#C38D9E', '#41B3A3', '#8A9B88'];
    return {
      id: `shift-${eventData.id}`,
      title: eventData.user ? eventData.user.username : 'Unassigned',
      start: new Date(eventData.start_time),
      end: new Date(eventData.end_time),
      userId: eventData.user_id,
      recurring_shift_id: eventData.recurring_shift_id,
      style: {
        backgroundColor: colors[colorIndex],
        borderRadius: '6px',
        opacity: 0.8,
        color: 'white',
      },
    };
  }, []);

  const fetchAllEvents = useCallback(() => {
    const start = moment().startOf('month').startOf('week').toISOString();
    const end = moment().endOf('month').endOf('week').toISOString();
    axios
      .get(`${API_URL}/shifts`, { params: { start_date: start, end_date: end } })
      .then((res) => setEvents(res.data.map(formatEvent)))
      .catch((err) => console.error('Error fetching shifts', err));
  }, [formatEvent]);

  useEffect(() => {
    fetchAllEvents();
    axios.get(`${API_URL}/users`).then((res) => setUsers(res.data));
  }, [fetchAllEvents]);

  const createPayload = () => ({
    start_time: moment.utc(`${shiftDate}T${shiftStartTime}`).toISOString(),
    end_time: moment.utc(`${shiftDate}T${shiftEndTime}`).toISOString(),
    user_id: selectedUserId ? parseInt(selectedUserId) : null,
    is_recurring: isRecurring,
    recurrence_months: recurrenceMonths,
    apply_to_all: applyToAll,
  });

  const handleSave = () => {
    const payload = createPayload();

    const request = editingShiftId
      ? axios.put(`${API_URL}/shifts/${editingShiftId}`, payload)
      : axios.post(`${API_URL}/shifts`, payload);

    request
      .then(() => {
        fetchAllEvents();
        closeModal();
      })
      .catch((err) => {
        console.error('Error saving shift', err);
        alert('Could not save shift.');
      });
  };

  const onEventDrop = ({ event, start, end }) => {
    const payload = {
      start_time: moment.utc(start).toISOString(),
      end_time: moment.utc(end).toISOString(),
      user_id: event.userId,
    };
    axios
      .put(`${API_URL}/shifts/${event.id.replace('shift-', '')}`, payload)
      .then(fetchAllEvents)
      .catch((err) => console.error('Error updating shift time', err));
  };

  return (
    <div>
      <DraggableCalendar
        localizer={localizer}
        events={events}
        defaultView="week"
        style={{ height: '90vh' }}
        onSelectSlot={(slotInfo) => openModal(slotInfo.start)}
        selectable
        onSelectEvent={openEditModal}
        onEventDrop={onEventDrop}
        resizable
      />

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Shift Modal">
        <h2>{editingShiftId ? 'Edit Shift' : 'Add Shift'}</h2>
        <label>
          Date: <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} />
        </label>
        <label>
          Start Time:{' '}
          <input type="time" value={shiftStartTime} onChange={(e) => setShiftStartTime(e.target.value)} />
        </label>
        <label>
          End Time:{' '}
          <input type="time" value={shiftEndTime} onChange={(e) => setShiftEndTime(e.target.value)} />
        </label>
        <label>
          Assign User:
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </label>
        <label>
          Recurring:{' '}
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
        </label>
        {isRecurring && (
          <label>
            Number of Months:{' '}
            <input
              type="number"
              min="1"
              value={recurrenceMonths}
              onChange={(e) => setRecurrenceMonths(e.target.value)}
            />
          </label>
        )}
        {editingShiftId && (
          <label>
            Apply to all recurring:{' '}
            <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} />
          </label>
        )}
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleSave}>Save</button>
          <button onClick={closeModal} style={{ marginLeft: '1rem' }}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ShiftCalendar;

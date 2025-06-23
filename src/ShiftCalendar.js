import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment-timezone';
import 'moment/locale/en-gb'; 
import axios from 'axios';
import Modal from 'react-modal';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// FINAL-VERSION-CHECK-CALENDAR-V18

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

    const fetchAllEvents = async () => {
        try {
            const startDate = moment().startOf('month').toISOString();
            const endDate = moment().add(2, 'months').endOf('month').toISOString();
            const res = await axios.get(`${API_URL}/shifts?start_date=${startDate}&end_date=${endDate}`);
            setEvents(res.data.map(formatEvent));
        } catch (err) {
            console.error("Failed to fetch events", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/users`);
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    useEffect(() => {
        fetchAllEvents();
        fetchUsers();
    }, []);

    const formatEvent = useCallback((eventData) => {
        return {
            id: `shift-${eventData.id}`,
            title: eventData.user ? eventData.user.username : 'Unassigned',
            start: new Date(eventData.start_time),
            end: new Date(eventData.end_time),
            userId: eventData.user_id,
            recurring_shift_id: eventData.recurring_shift_id,
            isHoliday: false
        };
    }, []);

    const openModal = ({ start }) => {
        const localMoment = moment(start);
        setShiftDate(localMoment.format('YYYY-MM-DD'));
        setShiftStartTime(localMoment.format('HH:00'));
        setShiftEndTime(localMoment.add(1, 'hour').format('HH:00'));
        setSelectedUserId('');
        setIsRecurring(false);
        setRecurrenceMonths(1);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const createPayload = () => ({
        start_time: moment.tz(`${shiftDate}T${shiftStartTime}`, 'Europe/London').toISOString(),
        end_time: moment.tz(`${shiftDate}T${shiftEndTime}`, 'Europe/London').toISOString(),
        user_id: selectedUserId ? parseInt(selectedUserId) : null,
    });

    const handleSave = () => {
        const payload = {
            ...createPayload(),
            is_recurring: isRecurring,
            recurrence_months: recurrenceMonths,
        };

        axios.post(`${API_URL}/shifts`, payload)
            .then(() => {
                fetchAllEvents();
                closeModal();
            })
            .catch(err => {
                console.error("Error saving shift", err);
                alert("Could not save shift.");
            });
    };

    return (
        <div>
            <h2>Shift Calendar</h2>
            <DraggableCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                selectable
                onSelectSlot={openModal}
                style={{ height: 700 }}
            />

            <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Add Shift">
                <h2>Create Shift</h2>
                <form>
                    <div>
                        <label>Date:</label>
                        <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} />
                    </div>
                    <div>
                        <label>Start Time:</label>
                        <input type="time" value={shiftStartTime} onChange={e => setShiftStartTime(e.target.value)} />
                    </div>
                    <div>
                        <label>End Time:</label>
                        <input type="time" value={shiftEndTime} onChange={e => setShiftEndTime(e.target.value)} />
                    </div>
                    <div>
                        <label>User:</label>
                        <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                            <option value="">Unassigned</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.username}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={e => setIsRecurring(e.target.checked)}
                            />
                            Recurring weekly?
                        </label>
                        {isRecurring && (
                            <div>
                                <label>How many months?</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="6"
                                    value={recurrenceMonths}
                                    onChange={e => setRecurrenceMonths(parseInt(e.target.value))}
                                />
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <button type="button" onClick={handleSave}>Save</button>
                        <button type="button" onClick={closeModal}>Cancel</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

export default ShiftCalendar;


import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const NAV_ITEMS = [
    { id: 'users', label: 'All Users' },
    { id: 'home', label: 'Home' },
    { id: 'stage1', label: 'Stage1' },
    { id: 'stage2', label: 'Stage2' },
    { id: 'stage3', label: 'Stage3' },
    { id: 'search', label: 'Search User' },
    { id: 'profile', label: 'Profile' },
];
const DURATION_OPTIONS = Array.from({ length: 6 }, (_, index) => {
    const minutes = (index + 1) * 10;
    return {
        value: String(minutes),
        label: `${minutes} minutes`,
    };
});
const PAGE_TO_STATUS = {
    home: 'published',
    stage1: 'stage1',
    stage2: 'stage2',
    stage3: 'stage3',
};
const STATUS_LABELS = {
    stage3: 'Stage3',
    stage2: 'Stage2',
    stage1: 'Stage1',
    published: 'Published',
};

function App() {
    const [activePage, setActivePage] = useState('users');
    const [now, setNow] = useState(() => new Date());
    const [authView, setAuthView] = useState('login');
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [authSuccess, setAuthSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('wittingUser');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersError, setUsersError] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventsByStatus, setEventsByStatus] = useState({
        stage3: [],
        stage2: [],
        stage1: [],
        published: [],
    });
    const [eventsLoading, setEventsLoading] = useState({
        stage3: false,
        stage2: false,
        stage1: false,
        published: false,
    });
    const [eventsError, setEventsError] = useState({
        stage3: '',
        stage2: '',
        stage1: '',
        published: '',
    });
    const [eventUser, setEventUser] = useState(null);
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventDuration, setEventDuration] = useState('');
    const [eventError, setEventError] = useState('');
    const [eventSuccess, setEventSuccess] = useState('');
    const [isEventSubmitting, setIsEventSubmitting] = useState(false);
    const [eventActionError, setEventActionError] = useState('');
    const [eventActionSuccess, setEventActionSuccess] = useState('');
    const [activeEventActionId, setActiveEventActionId] = useState('');
    const userMenuRef = useRef(null);

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        localStorage.setItem('wittingUser', JSON.stringify(currentUser));
    }, [currentUser]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    const fetchUsers = async () => {
        try {
            setUsersError('');
            setIsLoadingUsers(true);

            const response = await fetch(`${API_URL}/users`);
            const data = await response.json();

            if (!response.ok) {
                setUsersError(data.message || 'Could not load users.');
                return;
            }

            setUsers(data.users || []);
        } catch (err) {
            setUsersError('Network error: could not load users.');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchEventsByStatus = async (status) => {
        try {
            setEventsError((prev) => ({ ...prev, [status]: '' }));
            setEventsLoading((prev) => ({ ...prev, [status]: true }));

            const response = await fetch(`${API_URL}/events?status=${status}`);
            const data = await response.json();

            if (!response.ok) {
                setEventsError((prev) => ({ ...prev, [status]: data.message || 'Could not load events.' }));
                return;
            }

            setEventsByStatus((prev) => ({ ...prev, [status]: data.events || [] }));
        } catch (err) {
            setEventsError((prev) => ({ ...prev, [status]: 'Network error: could not load events.' }));
        } finally {
            setEventsLoading((prev) => ({ ...prev, [status]: false }));
        }
    };

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        if (activePage === 'users' || activePage === 'search') {
            fetchUsers();
        }

        const status = PAGE_TO_STATUS[activePage];
        if (status) {
            fetchEventsByStatus(status);
        }
    }, [activePage, currentUser]);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredUsers = useMemo(
        () =>
            users.filter((user) => {
                if (!normalizedSearch) {
                    return true;
                }

                return user.name?.toLowerCase().includes(normalizedSearch) || user.email?.toLowerCase().includes(normalizedSearch);
            }),
        [normalizedSearch, users]
    );

    const handleRegister = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');

        if (!registerName || !registerEmail || !registerPassword || !registerPasswordConfirm) {
            setAuthError('All fields are required.');
            return;
        }

        if (registerPassword !== registerPasswordConfirm) {
            setAuthError('Passwords do not match.');
            return;
        }

        if (registerPassword.length < 8) {
            setAuthError('Password must be at least 8 characters long.');
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: registerName,
                    email: registerEmail,
                    password: registerPassword,
                    passwordConfirm: registerPasswordConfirm,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setAuthError(data.message || 'Registration failed');
                return;
            }

            setAuthSuccess(data.message || 'Registration successful');
            setRegisterName('');
            setRegisterEmail('');
            setRegisterPassword('');
            setRegisterPasswordConfirm('');
            setLoginEmail(registerEmail);
            setAuthView('login');
        } catch (err) {
            setAuthError('Network error: please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthSuccess('');

        if (!loginEmail || !loginPassword) {
            setAuthError('Email and password are required.');
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                setAuthError(data.message || 'Login failed');
                return;
            }

            setCurrentUser(data.user);
            setLoginPassword('');
            setAuthSuccess(data.message || 'Login successful');
            setActivePage('users');
        } catch (err) {
            setAuthError('Network error: please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeEventModal = () => {
        setEventUser(null);
        setEventDescription('');
        setEventDate('');
        setEventDuration('');
        setEventError('');
        setEventSuccess('');
        setIsEventSubmitting(false);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setIsUserMenuOpen(false);
        setLoginPassword('');
        setAuthSuccess('');
        setEventActionError('');
        setEventActionSuccess('');
        localStorage.removeItem('wittingUser');
        closeEventModal();
    };

    const openEventModal = (user) => {
        setEventUser(user);
        setEventDescription('');
        setEventDate('');
        setEventDuration('');
        setEventError('');
        setEventSuccess('');
    };
    const handleCreateEvent = async () => {
        setEventError('');
        setEventSuccess('');

        if (!currentUser?._id || !eventUser?._id) {
            setEventError('User information is missing. Please log in again.');
            return;
        }

        if (!eventDescription.trim() || !eventDate || !eventDuration) {
            setEventError('Description, date, and time duration are required.');
            return;
        }

        try {
            setIsEventSubmitting(true);

            const response = await fetch(`${API_URL}/event/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: currentUser._id,
                    targetId: eventUser._id,
                    description: eventDescription.trim(),
                    date: eventDate,
                    timeDuration: Number(eventDuration),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setEventError(data.message || 'Could not create event.');
                return;
            }

            setEventSuccess(data.message || 'Event created successfully.');
            await fetchEventsByStatus('stage3');
            closeEventModal();
            setEventActionSuccess(data.message || 'Event created successfully.');
            setActivePage('stage3');
        } catch (err) {
            setEventError('Network error: could not create event.');
        } finally {
            setIsEventSubmitting(false);
        }
    };

    const handleAdvanceEvent = async (eventId) => {
        try {
            setActiveEventActionId(eventId);
            setEventActionError('');
            setEventActionSuccess('');

            const response = await fetch(`${API_URL}/event/${eventId}/advance`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (!response.ok) {
                setEventActionError(data.message || 'Could not move event to the next stage.');
                return;
            }

            setEventActionSuccess(data.message || 'Event moved successfully.');
            await Promise.all(['stage3', 'stage2', 'stage1'].map((status) => fetchEventsByStatus(status)));
        } catch (err) {
            setEventActionError('Network error: could not update event status.');
        } finally {
            setActiveEventActionId('');
        }
    };

    const handlePublishEvent = async (eventId) => {
        try {
            setActiveEventActionId(eventId);
            setEventActionError('');
            setEventActionSuccess('');

            const response = await fetch(`${API_URL}/event/${eventId}/publish`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (!response.ok) {
                setEventActionError(data.message || 'Could not publish event.');
                return;
            }

            setEventActionSuccess(data.message || 'Event published successfully.');
            await Promise.all(['stage1', 'published'].map((status) => fetchEventsByStatus(status)));
        } catch (err) {
            setEventActionError('Network error: could not publish event.');
        } finally {
            setActiveEventActionId('');
        }
    };

    const formattedDate = now.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedTime = now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const renderEventSection = (status) => {
        const title = STATUS_LABELS[status];
        const events = eventsByStatus[status] || [];
        const isLoading = eventsLoading[status];
        const error = eventsError[status];
        const isPublished = status === 'published';

        return (
            <div className="w-full rounded-3xl border border-indigo-100 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">{title}</h2>
                        <p className="mt-1 text-gray-600">
                            {isPublished ? 'Published events live here.' : `Events currently waiting in ${title}.`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchEventsByStatus(status)}
                        className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Refresh
                    </button>
                </div>

                {eventActionError && <div className="mb-4 rounded-xl border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-900">{eventActionError}</div>}
                {eventActionSuccess && <div className="mb-4 rounded-xl border border-green-200 bg-green-100 px-4 py-3 text-sm text-green-900">{eventActionSuccess}</div>}
                {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-100 px-4 py-3 text-sm text-red-900">{error}</div>}

                {isLoading ? (
                    <p className="font-medium text-indigo-700">Loading events...</p>
                ) : events.length === 0 ? (
                    <p className="text-gray-600">No events found in this stage.</p>
                ) : (
                    <div className="grid gap-4">
                        {events.map((event) => (
                            <div key={event._id} className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-white to-indigo-50 p-5 shadow-sm">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                                                {STATUS_LABELS[event.status]}
                                            </span>
                                            <span className="text-xs font-medium text-slate-500">
                                                Created {new Date(event.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-base font-semibold text-slate-800">{event.description}</p>
                                        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                                            <div className="rounded-xl bg-white/80 p-3">
                                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-500">Creator</p>
                                                <p className="mt-1 font-bold text-slate-900">{event.creatorId?.name || 'Unknown user'}</p>
                                                <p>{event.creatorId?.email || 'No email'}</p>
                                            </div>
                                            <div className="rounded-xl bg-white/80 p-3">
                                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-500">Target</p>
                                                <p className="mt-1 font-bold text-slate-900">{event.targetId?.name || 'Unknown user'}</p>
                                                <p>{event.targetId?.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-700">
                                            <span>Date: {new Date(event.date).toLocaleDateString()}</span>
                                            <span>Duration: {event.timeDuration} minutes</span>
                                        </div>
                                    </div>

                                    {!isPublished && (
                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            {event.status !== 'stage1' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdvanceEvent(event._id)}
                                                    disabled={activeEventActionId === event._id}
                                                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    {activeEventActionId === event._id ? 'Updating...' : 'Edit'}
                                                </button>
                                            )}
                                            {event.status === 'stage1' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePublishEvent(event._id)}
                                                    disabled={activeEventActionId === event._id}
                                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    {activeEventActionId === event._id ? 'Publishing...' : 'Confirm'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-fuchsia-200 via-sky-100 to-cyan-100 p-6">
                <div className="w-full max-w-lg mx-auto bg-white/95 p-8 rounded-3xl shadow-2xl border border-indigo-100 backdrop-blur-sm">
                    <div className="mb-6 text-center">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-cyan-600">
                            Welcome to Witting
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {authView === 'login' ? 'Login with your email and password' : 'Create a new account'}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                setAuthView('login');
                                setAuthError('');
                                setAuthSuccess('');
                            }}
                            className={`px-4 py-2 rounded-xl font-semibold transition ${
                                authView === 'login'
                                    ? 'bg-white text-indigo-700 shadow-lg'
                                    : 'bg-indigo-100/70 text-indigo-600 hover:bg-indigo-200/80'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAuthView('register');
                                setAuthError('');
                                setAuthSuccess('');
                            }}
                            className={`px-4 py-2 rounded-xl font-semibold transition ${
                                authView === 'register'
                                    ? 'bg-white text-indigo-700 shadow-lg'
                                    : 'bg-indigo-100/70 text-indigo-600 hover:bg-indigo-200/80'
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {authError && (
                        <div className="mb-4 p-3 text-sm text-red-900 bg-red-100/90 rounded-xl border border-red-200 shadow-sm">
                            {authError}
                        </div>
                    )}
                    {authSuccess && (
                        <div className="mb-4 p-3 text-sm text-green-900 bg-green-100/90 rounded-xl border border-green-200 shadow-sm">
                            {authSuccess}
                        </div>
                    )}

                    {authView === 'login' ? (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-indigo-700">Email address</label>
                                <input
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-indigo-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-indigo-700">Password</label>
                                <input
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-indigo-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition"
                                    type="password"
                                    placeholder="Your password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-fuchsia-500 via-indigo-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transform transition duration-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {isSubmitting ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-indigo-700">Full name</label>
                                <input
                                    value={registerName}
                                    onChange={(e) => setRegisterName(e.target.value)}
                                    className="w-full px-4 py-3 border border-indigo-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition"
                                    type="text"
                                    placeholder="Jane Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-indigo-700">Email address</label>
                                <input
                                    value={registerEmail}
                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-indigo-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-indigo-700">Password</label>
                                <input
                                    value={registerPassword}
                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-indigo-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition"
                                    type="password"
                                    placeholder="At least 8 characters"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-indigo-700">Confirm password</label>
                                <input
                                    value={registerPasswordConfirm}
                                    onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                                    className="w-full px-4 py-3 border border-indigo-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                                    type="password"
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-fuchsia-500 via-indigo-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transform transition duration-200 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {isSubmitting ? 'Creating account...' : 'Create account'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-200 via-sky-100 to-cyan-100 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-4 flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-100 via-lime-50 to-green-100 px-5 py-4 text-emerald-950 shadow-2xl md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-lime-500 to-green-400 text-xl font-black text-white shadow-lg">
                            W
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Witting</h2>
                        </div>
                    </div>

                    <div className="text-left md:text-right">
                        <p className="text-base font-bold text-emerald-950">
                            {formattedDate} | {formattedTime}
                        </p>
                    </div>
                </div>

                <div className="mb-6 overflow-visible rounded-3xl border border-white/60 bg-white/80 shadow-2xl backdrop-blur-md">
                    <div className="flex flex-col gap-4 border-b border-slate-200/80 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            {NAV_ITEMS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        setActivePage(item.id);
                                        setEventActionError('');
                                        setEventActionSuccess('');
                                    }}
                                    className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                                        activePage === item.id
                                            ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-lg'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative self-start lg:self-auto" ref={userMenuRef}>
                            <button
                                type="button"
                                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
                            >
                                <span>{currentUser.name}</span>
                                <span aria-hidden="true">{isUserMenuOpen ? '^' : 'v'}</span>
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-indigo-100 bg-white p-2 shadow-xl">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {activePage === 'home' && renderEventSection('published')}

                {activePage === 'users' && (
                    <div className="w-full bg-white/95 p-8 rounded-3xl shadow-2xl border border-indigo-100 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600">All Users</h2>
                                <p className="text-gray-600 mt-1">Showing registered users data</p>
                            </div>
                            <button
                                type="button"
                                onClick={fetchUsers}
                                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                            >
                                Refresh
                            </button>
                        </div>

                        {usersError && <div className="mb-4 p-3 text-sm text-red-900 bg-red-100/90 rounded-xl border border-red-200 shadow-sm">{usersError}</div>}

                        {isLoadingUsers ? (
                            <p className="text-indigo-700 font-medium">Loading users...</p>
                        ) : users.length === 0 ? (
                            <p className="text-gray-600">No users found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-indigo-50 text-indigo-700">
                                            <th className="p-3 font-semibold rounded-l-xl">Name</th>
                                            <th className="p-3 font-semibold">Email</th>
                                            <th className="p-3 font-semibold">Created</th>
                                            <th className="p-3 font-semibold rounded-r-xl">Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr key={user._id} className="border-b border-indigo-100">
                                                <td className="p-3 text-gray-800">{user.name}</td>
                                                <td className="p-3 text-gray-700">{user.email}</td>
                                                <td className="p-3 text-gray-700">{new Date(user.createdAt).toLocaleString()}</td>
                                                <td className="p-3 text-gray-700">{new Date(user.updatedAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
                {activePage === 'stage3' && renderEventSection('stage3')}
                {activePage === 'stage2' && renderEventSection('stage2')}
                {activePage === 'stage1' && renderEventSection('stage1')}

                {activePage === 'search' && (
                    <div className="w-full bg-white/95 p-8 rounded-3xl shadow-2xl border border-indigo-100 backdrop-blur-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">Search Users</h2>
                                <p className="text-gray-600 mt-1">Find users by name or email and create events from the popup.</p>
                            </div>
                            <button
                                type="button"
                                onClick={fetchUsers}
                                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="mb-5">
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 border border-indigo-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                                type="text"
                                placeholder="Search by name or email..."
                            />
                        </div>

                        {usersError && <div className="mb-4 p-3 text-sm text-red-900 bg-red-100/90 rounded-xl border border-red-200 shadow-sm">{usersError}</div>}

                        {isLoadingUsers ? (
                            <p className="text-indigo-700 font-medium">Loading users...</p>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-gray-600">No matching users found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-indigo-50 text-indigo-700">
                                            <th className="p-3 font-semibold rounded-l-xl">Name</th>
                                            <th className="p-3 font-semibold">Email</th>
                                            <th className="p-3 font-semibold rounded-r-xl">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user._id} className="border-b border-indigo-100">
                                                <td className="p-3 text-gray-800">{user.name}</td>
                                                <td className="p-3 text-gray-700">{user.email}</td>
                                                <td className="p-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEventModal(user)}
                                                        className="px-3 py-2 rounded-lg bg-fuchsia-600 text-white text-sm font-semibold hover:bg-fuchsia-700 transition"
                                                    >
                                                        Add Event
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activePage === 'profile' && (
                    <div className="w-full bg-white/95 p-8 rounded-3xl shadow-2xl border border-indigo-100 backdrop-blur-sm">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Profile</p>
                                <h2 className="mt-2 text-3xl font-black text-slate-800">{currentUser.name}</h2>
                                <p className="mt-2 text-slate-600">Your account details are shown here for quick reference.</p>
                            </div>
                            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-800 px-5 py-4 text-white shadow-xl">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Signed In</p>
                                <p className="mt-2 text-lg font-bold">{currentUser.email}</p>
                            </div>
                        </div>

                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
                                <p className="text-sm font-semibold text-indigo-600">Name</p>
                                <p className="mt-2 text-lg font-bold text-slate-800">{currentUser.name}</p>
                            </div>
                            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5">
                                <p className="text-sm font-semibold text-cyan-700">Email</p>
                                <p className="mt-2 text-lg font-bold text-slate-800">{currentUser.email}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {eventUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-indigo-100">
                        <h3 className="text-2xl font-bold text-indigo-700">Add Event</h3>
                        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-slate-700 md:flex-row md:items-center">
                            <div className="flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">My Name</p>
                                <p className="mt-1 font-bold text-slate-900">{currentUser.name}</p>
                            </div>
                            <div className="hidden h-12 w-px bg-indigo-200 md:block" />
                            <div className="flex-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Selected User</p>
                                <p className="mt-1 font-bold text-slate-900">{eventUser.name}</p>
                                <p className="text-xs text-slate-500">ID: {eventUser._id}</p>
                            </div>
                        </div>
                        {eventError && (
                            <div className="mt-4 rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-900">
                                {eventError}
                            </div>
                        )}
                        {eventSuccess && (
                            <div className="mt-4 rounded-lg border border-green-200 bg-green-100 px-3 py-2 text-sm text-green-900">
                                {eventSuccess}
                            </div>
                        )}

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-indigo-700">Description</label>
                                <textarea
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                    disabled={isEventSubmitting}
                                    rows={3}
                                    className="w-full rounded-xl border border-indigo-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="Write event details..."
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-indigo-700">Date</label>
                                <input
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    disabled={isEventSubmitting}
                                    type="date"
                                    className="w-full rounded-xl border border-indigo-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-indigo-700">Time Duration</label>
                                <select
                                    value={eventDuration}
                                    onChange={(e) => setEventDuration(e.target.value)}
                                    disabled={isEventSubmitting}
                                    className="w-full rounded-xl border border-indigo-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">Select duration</option>
                                    {DURATION_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleCreateEvent}
                                disabled={isEventSubmitting}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isEventSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                            <button
                                type="button"
                                onClick={closeEventModal}
                                disabled={isEventSubmitting}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

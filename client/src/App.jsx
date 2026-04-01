import React, { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
    const [activePage, setActivePage] = useState('users');
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
    const [eventUser, setEventUser] = useState(null);
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventError, setEventError] = useState('');
    const [eventSuccess, setEventSuccess] = useState('');
    const [isEventLocked, setIsEventLocked] = useState(false);
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

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        if (activePage === 'users' || activePage === 'search') {
            fetchUsers();
        }
    }, [activePage, currentUser]);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredUsers = users.filter((user) => {
        if (!normalizedSearch) {
            return true;
        }

        return (
            user.name?.toLowerCase().includes(normalizedSearch) ||
            user.email?.toLowerCase().includes(normalizedSearch)
        );
    });

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

    const handleLogout = () => {
        setCurrentUser(null);
        setIsUserMenuOpen(false);
        setLoginPassword('');
        setAuthSuccess('');
        localStorage.removeItem('wittingUser');
        closeEventModal();
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

    const openEventModal = (user) => {
        setEventUser(user);
        setEventDescription('');
        setEventDate('');
        setEventTime('');
        setEventError('');
        setEventSuccess('');
        setIsEventLocked(false);
    };

    const closeEventModal = () => {
        setEventUser(null);
        setEventDescription('');
        setEventDate('');
        setEventTime('');
        setEventError('');
        setEventSuccess('');
        setIsEventLocked(false);
    };

    const handleConfirmEvent = () => {
        setEventError('');
        setEventSuccess('');

        if (!eventDescription.trim() || !eventDate || !eventTime) {
            setEventError('Description, date, and time are required.');
            return;
        }

        setEventSuccess('Event details confirmed. You can edit or cancel.');
        setIsEventLocked(true);
    };

    const handleEditEvent = () => {
        setEventSuccess('');
        setEventError('');
        setIsEventLocked(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-fuchsia-200 via-sky-100 to-cyan-100 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-4 flex justify-end">
                    <div className="relative" ref={userMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsUserMenuOpen((prev) => !prev)}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-md hover:bg-indigo-50 transition"
                        >
                            <span>{currentUser.name}</span>
                            <span>v</span>
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

                <div className="flex items-center justify-center gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => setActivePage('users')}
                        className={`px-4 py-2 rounded-xl font-semibold transition ${
                            activePage === 'users'
                                ? 'bg-white text-indigo-700 shadow-lg'
                                : 'bg-indigo-100/70 text-indigo-600 hover:bg-indigo-200/80'
                        }`}
                    >
                        All Users
                    </button>
                    <button
                        type="button"
                        onClick={() => setActivePage('search')}
                        className={`px-4 py-2 rounded-xl font-semibold transition ${
                            activePage === 'search'
                                ? 'bg-white text-indigo-700 shadow-lg'
                                : 'bg-indigo-100/70 text-indigo-600 hover:bg-indigo-200/80'
                        }`}
                    >
                        Search User
                    </button>
                </div>

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

                {activePage === 'search' && (
                    <div className="w-full bg-white/95 p-8 rounded-3xl shadow-2xl border border-indigo-100 backdrop-blur-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">Search Users</h2>
                                <p className="text-gray-600 mt-1">Find users by name or email</p>
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
            </div>

            {eventUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-indigo-100">
                        <h3 className="text-2xl font-bold text-indigo-700">Add Event</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            For <span className="font-semibold">{eventUser.name}</span> ({eventUser.email})
                        </p>

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
                                    disabled={isEventLocked}
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
                                    disabled={isEventLocked}
                                    type="date"
                                    className="w-full rounded-xl border border-indigo-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-indigo-700">Time</label>
                                <input
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    disabled={isEventLocked}
                                    type="time"
                                    className="w-full rounded-xl border border-indigo-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleConfirmEvent}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                            >
                                Confirm
                            </button>
                            <button
                                type="button"
                                onClick={handleEditEvent}
                                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={closeEventModal}
                                className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition"
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

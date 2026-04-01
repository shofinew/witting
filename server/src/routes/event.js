const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');

const router = express.Router();

const STATUS_ORDER = {
    stage3: 'stage2',
    stage2: 'stage1',
};

const VALID_STATUSES = ['stage3', 'stage2', 'stage1', 'published'];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.post('/event/add', async (req, res) => {
    try {
        const { creatorId, targetId, description, date, timeDuration } = req.body;

        if (!creatorId || !targetId || !description || !date || !timeDuration) {
            return res.status(400).json({ message: 'creatorId, targetId, description, date, and timeDuration are required.' });
        }

        if (!isValidObjectId(creatorId) || !isValidObjectId(targetId)) {
            return res.status(400).json({ message: 'Invalid creatorId or targetId.' });
        }

        const durationNumber = Number(timeDuration);
        if (!Number.isInteger(durationNumber) || durationNumber < 10 || durationNumber > 60) {
            return res.status(400).json({ message: 'timeDuration must be a whole number between 10 and 60.' });
        }

        const [creator, target] = await Promise.all([
            User.findById(creatorId).lean(),
            User.findById(targetId).lean(),
        ]);

        if (!creator || !target) {
            return res.status(404).json({ message: 'Creator or target user not found.' });
        }

        const event = new Event({
            creatorId,
            targetId,
            description: description.trim(),
            date: new Date(date),
            timeDuration: durationNumber,
            status: 'stage3',
        });

        await event.save();
        await event.populate([
            { path: 'creatorId', select: 'name email' },
            { path: 'targetId', select: 'name email' },
        ]);

        return res.status(201).json({
            message: 'Event created successfully.',
            event,
        });
    } catch (error) {
        console.error('Create event error:', error);
        return res.status(500).json({ message: 'Server error while creating event.' });
    }
});

router.get('/events', async (req, res) => {
    try {
        const { status } = req.query;

        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'A valid status query is required.' });
        }

        const events = await Event.find({ status })
            .populate('creatorId', 'name email')
            .populate('targetId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ events });
    } catch (error) {
        console.error('Fetch events error:', error);
        return res.status(500).json({ message: 'Server error while fetching events.' });
    }
});

router.patch('/event/:eventId/advance', async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!isValidObjectId(eventId)) {
            return res.status(400).json({ message: 'Invalid event id.' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        const nextStatus = STATUS_ORDER[event.status];
        if (!nextStatus) {
            return res.status(400).json({ message: 'This event cannot be advanced from its current stage.' });
        }

        event.status = nextStatus;
        await event.save();
        await event.populate([
            { path: 'creatorId', select: 'name email' },
            { path: 'targetId', select: 'name email' },
        ]);

        return res.status(200).json({
            message: `Event moved to ${nextStatus}.`,
            event,
        });
    } catch (error) {
        console.error('Advance event error:', error);
        return res.status(500).json({ message: 'Server error while advancing event.' });
    }
});

router.patch('/event/:eventId/publish', async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!isValidObjectId(eventId)) {
            return res.status(400).json({ message: 'Invalid event id.' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        if (event.status !== 'stage1') {
            return res.status(400).json({ message: 'Only stage1 events can be published.' });
        }

        event.status = 'published';
        await event.save();
        await event.populate([
            { path: 'creatorId', select: 'name email' },
            { path: 'targetId', select: 'name email' },
        ]);

        return res.status(200).json({
            message: 'Event published successfully.',
            event,
        });
    } catch (error) {
        console.error('Publish event error:', error);
        return res.status(500).json({ message: 'Server error while publishing event.' });
    }
});

module.exports = router;

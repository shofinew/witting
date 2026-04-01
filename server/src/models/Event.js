const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
    {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        date: {
            type: Date,
            required: true,
        },
        timeDuration: {
            type: Number,
            required: true,
            min: 10,
            max: 60,
        },
        status: {
            type: String,
            enum: ['stage3', 'stage2', 'stage1', 'published'],
            default: 'stage3',
        },
    },
    {
        timestamps: true,
        collection: 'Event',
    }
);

module.exports = mongoose.model('Event', eventSchema);

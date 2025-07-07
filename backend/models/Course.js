const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        unique: true
    },
    courseCode: {
        type: String,
        required: true,
        unique: true
    },
    credits: {
        type: Number,
        required: true,
        min: 1
    },
    registeredStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    grade: {
        type: String,
        enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F']
    },
    gradePoint: {
        type: Number,
        min: 0,
        max: 4.0
    },
    dateAchieved: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate grade and grade points before saving
resultSchema.pre('save', function(next) {
    if (this.isModified('score')) {
        // Calculate grade based on score
        if (this.score >= 90) this.grade = 'A+';
        else if (this.score >= 85) this.grade = 'A';
        else if (this.score >= 80) this.grade = 'A-';
        else if (this.score >= 75) this.grade = 'B+';
        else if (this.score >= 70) this.grade = 'B';
        else if (this.score >= 65) this.grade = 'B-';
        else if (this.score >= 60) this.grade = 'C+';
        else if (this.score >= 55) this.grade = 'C';
        else if (this.score >= 50) this.grade = 'C-';
        else if (this.score >= 45) this.grade = 'D+';
        else if (this.score >= 40) this.grade = 'D';
        else this.grade = 'F';

        // Calculate grade points
        const gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'F': 0.0
        };
        this.gradePoint = gradePoints[this.grade] || 0.0;
    }
    next();
});

module.exports = mongoose.model('Result', resultSchema);
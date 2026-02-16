require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT ;
const HOST = process.env.HOST || '0.0.0.0';

// Path to JSON file for storing appointments
const APPOINTMENTS_FILE = path.join(__dirname, 'appointments.json');

// Load appointments from JSON file (or empty array if file doesn't exist)
function loadAppointments() {
    try {
        if (fs.existsSync(APPOINTMENTS_FILE)) {
            const data = fs.readFileSync(APPOINTMENTS_FILE, 'utf8');
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch (err) {
        console.error('Error loading appointments:', err.message);
    }
    return [];
}

// Save appointments to JSON file
function saveAppointments(appointments) {
    try {
        fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving appointments:', err.message);
        throw err;
    }
}

// Middleware
// Request logging (for debugging)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// CORS configuration for production domain
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow localhost for development
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        // Allow production domain (both Cyrillic and Punycode)
        if (origin.includes('дентал-фэмили.рф') || origin.includes('xn--80aafbqj0a.xn--p1ai')) {
            return callback(null, true);
        }
        
        // Allow Render backend domain
        if (origin.includes('dentalback-ah2h.onrender.com') || origin.includes('onrender.com')) {
            return callback(null, true);
        }
        
        callback(null, true); // Allow all origins for now
    },
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes must come BEFORE static file serving
// Store appointments in memory, loaded from/saved to JSON file
let appointments = loadAppointments();

// API endpoint to handle appointment form submission
app.post('/api/appointments', (req, res) => {
    try {
        const { name, phone } = req.body;

        // Validation
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Пожалуйста, заполните все поля'
            });
        }

        // Basic phone validation (Russian format)
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Пожалуйста, введите корректный номер телефона'
            });
        }

        // Create appointment object (status: приём = приём/ожидание, отмена = отменено)
        const appointment = {
            id: Date.now().toString(),
            name: name.trim(),
            phone: phone.trim(),
            createdAt: new Date().toISOString(),
            status: 'приём'
        };

        // Save appointment to in-memory array and to JSON file
        appointments.push(appointment);
        saveAppointments(appointments);

        // Log appointment (in production, send email notification, etc.)
        console.log('New appointment:', appointment);

        // Success response
        res.status(201).json({
            success: true,
            message: 'Спасибо! Ваша заявка принята. Мы свяжемся с вами в ближайшее время.',
            appointment: {
                id: appointment.id,
                name: appointment.name,
                phone: appointment.phone
            }
        });

    } catch (error) {
        console.error('Error processing appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при обработке заявки. Пожалуйста, попробуйте позже.'
        });
    }
});

// API endpoint to get all appointments (for admin purposes)
app.get('/api/appointments', (req, res) => {
    res.json({
        success: true,
        count: appointments.length,
        appointments: appointments
    });
});

// API endpoint to update appointment status (приём | отмена)
app.patch('/api/appointments/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowed = ['приём', 'отмена'];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Статус должен быть: приём или отмена'
            });
        }
        const index = appointments.findIndex(a => a.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Заявка не найдена' });
        }
        appointments[index].status = status;
        saveAppointments(appointments);
        res.json({ success: true, appointment: appointments[index] });
    } catch (err) {
        console.error('Error updating appointment:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// API endpoint to delete appointment
app.delete('/api/appointments/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = appointments.findIndex(a => a.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Заявка не найдена' });
        }
        appointments.splice(index, 1);
        saveAppointments(appointments);
        res.json({ success: true, message: 'Заявка удалена' });
    } catch (err) {
        console.error('Error deleting appointment:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        port: PORT,
        host: HOST
    });
});

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Произошла ошибка сервера. Пожалуйста, попробуйте позже.'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Admin page: дентал-фэмили.рф/admin (must come before static files)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public_html/admin.html'));
});
app.get('/admin/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public_html/admin.html'));
});

// Serve static files from public_html directory (must be LAST)
app.use(express.static(path.join(__dirname, '../public_html')));

// Start server (0.0.0.0 = accept connections from any host, for production domain)
app.listen(PORT, HOST, () => {
    console.log('='.repeat(50));
    console.log(`✅ Server is running on http://${HOST}:${PORT}`);
    console.log(`📡 API: http://${HOST}:${PORT}/api/appointments`);
    console.log(`🔐 Admin: http://${HOST}:${PORT}/admin`);
    console.log(`💚 Health: http://${HOST}:${PORT}/api/health`);
    console.log(`📁 Static files: ${path.join(__dirname, '../public_html')}`);
    console.log(`💾 Appointments file: ${APPOINTMENTS_FILE}`);
    console.log(`📊 Loaded ${appointments.length} appointments`);
    console.log('='.repeat(50));
});

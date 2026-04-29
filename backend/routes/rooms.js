const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const db = require('../db');

// Helper: compute bed stats for a room
function bedStats(r) {
    const allocs = db.allocations.all().filter(a => a.room_id === r.id);
    const confirmed_beds = allocs.filter(a => a.is_active === 1 || a.status === 'approved').length;
    const pending_beds   = allocs.filter(a => a.status === 'pending').length;
    const available_beds = Math.max(0, r.capacity - confirmed_beds - pending_beds);
    const joinable_beds  = Math.max(0, r.capacity - confirmed_beds); // includes pending slots
    return { confirmed_beds, pending_beds, available_beds, joinable_beds };
}

/* GET /api/rooms */
router.get('/', authenticate, (req, res) => {
    try {
        const rooms = db.rooms.all().map(r => ({ ...r, ...bedStats(r) }));
        res.json(rooms);
    }
    catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/rooms/available - rooms where confirmed_beds < capacity (pending counts as joinable) */
router.get('/available', authenticate, (req, res) => {
    try {
        const rooms = db.rooms.all()
            .filter(r => r.status !== 'maintenance')
            .map(r => ({ ...r, ...bedStats(r) }))
            .filter(r => r.joinable_beds > 0);  // show room as long as confirmed slots remain
        res.json(rooms);
    }
    catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/rooms/allocations/all */
router.get('/allocations/all', authenticate, (req, res) => {
    try {
        let allocs = db.allocations.all();
        if (req.user.role === 'student') {
            allocs = allocs.filter(a => a.student_id === req.user.id);
        }
        allocs = allocs.map(a => {
            const student = db.users.findBy('id', a.student_id);
            const room = db.rooms.findById(a.room_id);
            const explicitStatus = a.status || (a.is_active ? 'approved' : 'pending');
            return { ...a, studentName: student?.name, room_number: room?.room_number, type: room?.type, status: explicitStatus };
        });
        res.json(allocs.reverse());
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* GET /api/rooms/:id */
router.get('/:id', authenticate, (req, res) => {
    try {
        const room = db.rooms.findById(parseInt(req.params.id));
        if (!room) return res.status(404).json({ message: 'Room not found.' });
        res.json(room);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* POST /api/rooms/allocate  (students and admins) */
router.post('/allocate', authenticate, (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const student_id = isAdmin ? (req.body.student_id || req.body.studentId) : req.user.id;
        const co_student_id = req.body.co_student_id || null;
        const room_id = req.body.room_id || req.body.roomId;
        const start_date = req.body.start_date || req.body.startDate;
        const end_date = req.body.end_date || req.body.endDate;
        const notes = req.body.notes || null;

        if (!student_id || !room_id || !start_date || !end_date)
            return res.status(400).json({ message: 'All fields required.' });

        const room = db.rooms.findById(parseInt(room_id));
        if (!room || room.status === 'maintenance')
            return res.status(400).json({ message: 'Room under maintenance or invalid.' });
            
        const activeCount = db.allocations.all().filter(a => a.room_id === room.id && (a.is_active === 1 || a.status === 'pending' || a.status === 'approved')).length;
        const reqCount = 1 + (co_student_id ? 1 : 0);
        
        if (activeCount + reqCount > room.capacity)
            return res.status(400).json({ message: `Room capacity exceeded! Max capacity: ${room.capacity} bed(s).` });

        // If admin -> direct active allocation. If student -> pending request
        const status = isAdmin ? 'approved' : 'pending';
        const is_active = isAdmin ? 1 : 0;

        const alloc = db.allocations.create({
            student_id: parseInt(student_id), room_id: parseInt(room_id),
            start_date, end_date, notes, is_active, status
        });
        
        if (co_student_id) {
            db.allocations.create({
                student_id: parseInt(co_student_id), room_id: parseInt(room_id),
                start_date, end_date, notes, is_active, status
            });
        }
        
        if (isAdmin) {
            if (activeCount + reqCount >= room.capacity) {
                db.rooms.setStatus(parseInt(room_id), 'occupied');
            }
        }
        res.status(201).json({ message: isAdmin ? 'Space allocated successfully.' : 'Room request submitted! Awaiting admin approval.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PATCH /api/rooms/allocate/:id/approve (admin only) */
router.patch('/allocate/:id/approve', authenticate, requireAdmin, (req, res) => {
    try {
        const alloc = db.allocations.findById(parseInt(req.params.id));
        if (!alloc) return res.status(404).json({ message: 'Allocation not found.' });
        if (alloc.status === 'approved') return res.status(400).json({ message: 'Already approved.' });
        
        const room = db.rooms.findById(alloc.room_id);
        if (!room || room.status === 'maintenance') return res.status(400).json({ message: 'Room is invalid.' });

        const activeNow = db.allocations.all().filter(a => a.room_id === room.id && a.is_active === 1).length;
        if (activeNow + 1 > room.capacity) return res.status(400).json({ message: `Full capacity! Free beds: 0` });

        db.allocations.update(alloc.id, { status: 'approved', is_active: 1 });
        
        if (activeNow + 1 >= room.capacity) {
            db.rooms.setStatus(alloc.room_id, 'occupied');
        }
        res.json({ message: 'Room allocation approved.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* PATCH /api/rooms/allocate/:id/reject (admin only) */
router.patch('/allocate/:id/reject', authenticate, requireAdmin, (req, res) => {
    try {
        const alloc = db.allocations.findById(parseInt(req.params.id));
        if (!alloc) return res.status(404).json({ message: 'Allocation not found.' });
        
        db.allocations.update(alloc.id, { status: 'rejected', is_active: 0, notes: req.body.notes || alloc.notes });
        res.json({ message: 'Room allocation rejected.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* DELETE /api/rooms/allocate/:id  (admin only) */
router.delete('/allocate/:id', authenticate, requireAdmin, (req, res) => {
    try {
        const alloc = db.allocations.findById(parseInt(req.params.id));
        if (!alloc) return res.status(404).json({ message: 'Allocation not found.' });
        
        const room = db.rooms.findById(alloc.room_id);
        db.allocations.delete(alloc.id);
        
        const activeNow = db.allocations.all().filter(a => a.room_id === room.id && a.is_active === 1).length;
        if (activeNow < room.capacity && room.status === 'occupied') {
             db.rooms.setStatus(alloc.room_id, 'available');
        }
        res.json({ message: 'Allocation removed.' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

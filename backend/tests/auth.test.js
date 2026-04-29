/**
 * AUTH TESTS — Registration & Login
 * Tests: valid login, wrong password, unknown email,
 *         duplicate registration, missing fields, JWT issued
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const JWT_SECRET = 'hostelms_secret';

// ── Helpers (mirrors auth.js logic inline so no HTTP server needed) ──
async function hashPw(pw) { return bcrypt.hash(pw, 10); }
async function checkPw(plain, hash) { return bcrypt.compare(plain, hash); }
function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
}
function verifyToken(token) { return jwt.verify(token, JWT_SECRET); }

// ── Mock in-memory user store ──
const users = [];
async function register({ name, email, nic, phone, password, role = 'student' }) {
  if (!name || !email || !nic || !phone || !password)
    throw new Error('All fields are required.');
  if (users.find(u => u.email === email))
    throw new Error('Email already registered.');
  const hashed = await hashPw(password);
  const user = { id: users.length + 1, name, email, nic, phone, password: hashed, role, status: 'active' };
  users.push(user);
  return user;
}
async function login(email, password) {
  if (!email || !password) throw new Error('Email and password required.');
  const user = users.find(u => u.email === email);
  if (!user) throw new Error('Invalid email or password.');
  if (user.status === 'inactive') throw new Error('Account deactivated.');
  const match = await checkPw(password, user.password);
  if (!match) throw new Error('Invalid email or password.');
  return { user, token: makeToken(user) };
}

// ══════════════════════════════════════════════
describe('Authentication — Registration', () => {
  beforeEach(() => users.length = 0); // reset before each test

  test('TC-A01: Register with valid data succeeds', async () => {
    const u = await register({ name:'Test User', email:'test@hostel.lk', nic:'991234567V', phone:'0771234567', password:'SecurePass@1' });
    expect(u.id).toBe(1);
    expect(u.email).toBe('test@hostel.lk');
    expect(u.role).toBe('student');
  });

  test('TC-A02: Password is hashed (not stored in plain text)', async () => {
    const u = await register({ name:'Test User', email:'test@hostel.lk', nic:'991234567V', phone:'0771234567', password:'SecurePass@1' });
    expect(u.password).not.toBe('SecurePass@1');
    expect(u.password.startsWith('$2')).toBe(true); // bcrypt prefix
  });

  test('TC-A03: Duplicate email registration is rejected', async () => {
    await register({ name:'User A', email:'dup@hostel.lk', nic:'001234567V', phone:'0771234567', password:'Pass@1234' });
    await expect(register({ name:'User B', email:'dup@hostel.lk', nic:'011234567V', phone:'0771234568', password:'Pass@1234' }))
      .rejects.toThrow('Email already registered.');
  });

  test('TC-A04: Missing required fields throws error', async () => {
    await expect(register({ name:'', email:'x@hostel.lk', nic:'', phone:'', password:'' }))
      .rejects.toThrow('All fields are required.');
  });

  test('TC-A05: Role defaults to student if not specified', async () => {
    const u = await register({ name:'Test', email:'s@hostel.lk', nic:'121234567V', phone:'0771234567', password:'Pass@1234' });
    expect(u.role).toBe('student');
  });
});

describe('Authentication — Login', () => {
  beforeEach(async () => {
    users.length = 0;
    await register({ name:'Admin', email:'admin@hostel.lk', nic:'881234567V', phone:'0771234560', password:'Admin@1234', role:'admin' });
    await register({ name:'Student', email:'student@hostel.lk', nic:'991234567V', phone:'0771234561', password:'Student@1234' });
  });

  test('TC-A06: Valid admin login returns JWT token', async () => {
    const { token } = await login('admin@hostel.lk', 'Admin@1234');
    expect(token).toBeTruthy();
    const decoded = verifyToken(token);
    expect(decoded.role).toBe('admin');
  });

  test('TC-A07: Valid student login returns JWT token', async () => {
    const { token, user } = await login('student@hostel.lk', 'Student@1234');
    expect(token).toBeTruthy();
    expect(user.role).toBe('student');
  });

  test('TC-A08: Wrong password is rejected', async () => {
    await expect(login('admin@hostel.lk', 'WrongPass')).rejects.toThrow('Invalid email or password.');
  });

  test('TC-A09: Unknown email is rejected', async () => {
    await expect(login('nobody@hostel.lk', 'Any@1234')).rejects.toThrow('Invalid email or password.');
  });

  test('TC-A10: Missing email or password throws error', async () => {
    await expect(login('', 'Admin@1234')).rejects.toThrow('Email and password required.');
    await expect(login('admin@hostel.lk', '')).rejects.toThrow('Email and password required.');
  });

  test('TC-A11: Deactivated account cannot log in', async () => {
    const u = users.find(u => u.email === 'student@hostel.lk');
    u.status = 'inactive';
    await expect(login('student@hostel.lk', 'Student@1234')).rejects.toThrow('Account deactivated.');
  });
});

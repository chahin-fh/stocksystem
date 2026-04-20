const express = require('express');
const cors = require('cors');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const { normalizeEmail, signToken, hashPassword, verifyPassword } = require('./auth');
const { findUserByEmail, createUser, updateUser } = require('./userRepo');
const { requireAuth } = require('./authMiddleware');
const {
  listDatabasesByCreatorId,
  getFirstDatabaseByCreatorId,
  createDatabase,
  updateDatabaseByIdAndCreatorId,
} = require('./databaseRepo');
const {
  listFieldsByDatabaseId,
  createField,
  updateFieldById,
  deleteFieldById,
} = require('./fieldRepo');
const {
  listRecordsByDatabaseId,
  createRecord,
  deleteRecordById,
} = require('./recordRepo');
const {
  listActivitiesByDatabaseId,
  createActivity,
} = require('./activityRepo');

try {
  require('dotenv').config();
} catch {}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
db.init();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const fullName = String(req.body?.fullName || req.body?.full_name || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (fullName.length < 2) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      id: uuidv4(),
      fullName,
      email,
      passwordHash,
    });

    const token = signToken(user);

    res.status(201).json({
      user: { id: user.id, fullName: user.full_name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (password.length < 1) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);

    res.json({
      user: { id: user.id, fullName: user.full_name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/auth/profile', requireAuth, async (req, res, next) => {
  try {
    const fullName = String(req.body?.fullName || '').trim();
    if (fullName.length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters' });
    }

    const updated = await updateUser(req.user.id, { fullName });
    res.json({
      user: { id: updated.id, fullName: updated.full_name, email: updated.email }
    });
  } catch (err) {
    next(err);
  }
});

// Database routes
app.get('/api/databases', requireAuth, async (req, res, next) => {
  try {
    const databases = await listDatabasesByCreatorId(req.user.id);
    res.json(databases);
  } catch (err) {
    next(err);
  }
});

app.post('/api/databases', requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'Database name is required' });
    }

    const created = await createDatabase({
      id: uuidv4(),
      creatorId: req.user.id,
      name,
      description,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.get('/api/database', requireAuth, async (req, res, next) => {
  try {
    const dbRow = await getFirstDatabaseByCreatorId(req.user.id);
    res.json(dbRow);
  } catch (err) {
    next(err);
  }
});

app.patch('/api/database', requireAuth, async (req, res, next) => {
  try {
    const current = await getFirstDatabaseByCreatorId(req.user.id);
    if (!current) {
      return res.status(404).json({ error: 'No database found for this user' });
    }

    const updated = await updateDatabaseByIdAndCreatorId({
      id: current.id,
      creatorId: req.user.id,
      updates: req.body || {},
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Fields routes
app.get('/api/fields', requireAuth, async (req, res, next) => {
  try {
    const currentDb = await getFirstDatabaseByCreatorId(req.user.id);
    if (!currentDb) return res.json([]);

    const fields = await listFieldsByDatabaseId(currentDb.id);
    res.json(fields);
  } catch (err) {
    next(err);
  }
});

app.post('/api/fields', requireAuth, async (req, res, next) => {
  try {
    const { name, type, required } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const currentDb = await getFirstDatabaseByCreatorId(req.user.id);
    if (!currentDb) {
      return res.status(404).json({ error: 'Create a database first' });
    }

    const field = await createField({
      id: uuidv4(),
      databaseId: currentDb.id,
      name,
      type,
      required: !!required,
    });

    res.status(201).json(field);
  } catch (err) {
    next(err);
  }
});

app.patch('/api/fields/:id', requireAuth, async (req, res, next) => {
  try {
    const updated = await updateFieldById(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/fields/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await deleteFieldById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Field not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Records routes
app.get('/api/records', requireAuth, async (req, res, next) => {
  try {
    const currentDb = await getFirstDatabaseByCreatorId(req.user.id);
    if (!currentDb) return res.json([]);

    const records = await listRecordsByDatabaseId(currentDb.id);
    res.json(records);
  } catch (err) {
    next(err);
  }
});

app.post('/api/records', requireAuth, async (req, res, next) => {
  try {
    const { values } = req.body;
    if (!values) {
      return res.status(400).json({ error: 'Values are required' });
    }

    const currentDb = await getFirstDatabaseByCreatorId(req.user.id);
    if (!currentDb) {
      return res.status(404).json({ error: 'Create a database first' });
    }

    const record = await createRecord({
      id: uuidv4(),
      databaseId: currentDb.id,
      values
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/records/:id', requireAuth, async (req, res, next) => {
  try {
    await deleteRecordById(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Activities routes
app.get('/api/activities', requireAuth, async (req, res, next) => {
  try {
    const currentDb = await getFirstDatabaseByCreatorId(req.user.id);
    if (!currentDb) return res.json([]);

    const activities = await listActivitiesByDatabaseId(currentDb.id);
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

app.post('/api/activities', requireAuth, async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const currentDb = await getFirstDatabaseByCreatorId(req.user.id);
    if (!currentDb) {
      return res.status(404).json({ error: 'Create a database first' });
    }

    const activity = await createActivity({
      id: uuidv4(),
      databaseId: currentDb.id,
      action
    });

    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
});

// Reset route (for testing)
app.post('/api/reset', (req, res) => {
  db.reset();
  res.json({ success: true, message: 'Database reset' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`FieldBase API server running on http://localhost:${PORT}`);
});

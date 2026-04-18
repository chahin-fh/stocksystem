const express = require('express');
const cors = require('cors');
const db = require('./db');

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

// Database routes
app.get('/api/database', (req, res) => {
  res.json(db.getDatabase());
});

app.patch('/api/database', (req, res) => {
  const updated = db.updateDatabase(req.body);
  res.json(updated);
});

// Fields routes
app.get('/api/fields', (req, res) => {
  res.json(db.getFields());
});

app.post('/api/fields', (req, res) => {
  const { name, type, required } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }
  const field = db.addField({ name, type, required: required || false });
  res.status(201).json(field);
});

app.patch('/api/fields/:id', (req, res) => {
  const updated = db.updateField(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Field not found' });
  }
  res.json(updated);
});

app.delete('/api/fields/:id', (req, res) => {
  const deleted = db.deleteField(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Field not found' });
  }
  res.json({ success: true });
});

// Records routes
app.get('/api/records', (req, res) => {
  res.json(db.getRecords());
});

app.post('/api/records', (req, res) => {
  const { values } = req.body;
  if (!values) {
    return res.status(400).json({ error: 'Values are required' });
  }
  const record = db.addRecord(values);
  res.status(201).json(record);
});

app.patch('/api/records/:id', (req, res) => {
  const { values } = req.body;
  const updated = db.updateRecord(req.params.id, values);
  if (!updated) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.json(updated);
});

app.delete('/api/records/:id', (req, res) => {
  db.deleteRecord(req.params.id);
  res.json({ success: true });
});

// Activities routes
app.get('/api/activities', (req, res) => {
  res.json(db.getActivities());
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
  console.log(`API endpoints:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/database`);
  console.log(`  GET  /api/fields`);
  console.log(`  GET  /api/records`);
  console.log(`  GET  /api/activities`);
});

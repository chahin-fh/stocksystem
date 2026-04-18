const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'data.json');

// Default data structure
const defaultData = {
  database: null,
  fields: [],
  records: [],
  activities: []
};

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return { ...defaultData };
}

// Save data to file
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

// Database operations
const db = {
  data: loadData(),

  // Initialize with default database if none exists
  init() {
    if (!this.data.database) {
      this.data.database = {
        id: uuidv4(),
        name: 'My Database',
        description: 'Default database',
        fieldCount: 0,
        createdAt: new Date().toISOString()
      };
      this.save();
    }
    return this.data.database;
  },

  save() {
    return saveData(this.data);
  },

  // Database operations
  getDatabase() {
    return this.data.database;
  },

  updateDatabase(updates) {
    this.data.database = { ...this.data.database, ...updates };
    this.save();
    return this.data.database;
  },

  // Field operations
  getFields() {
    return this.data.fields;
  },

  addField(field) {
    const newField = {
      id: uuidv4(),
      ...field,
      createdAt: new Date().toISOString()
    };
    this.data.fields.push(newField);
    this.updateDatabase({ fieldCount: this.data.fields.length });
    this.save();
    this.addActivity(`Added field "${newField.name}"`);
    return newField;
  },

  updateField(id, updates) {
    const index = this.data.fields.findIndex(f => f.id === id);
    if (index === -1) return null;
    
    const oldName = this.data.fields[index].name;
    this.data.fields[index] = { ...this.data.fields[index], ...updates };
    this.save();
    
    if (updates.name && updates.name !== oldName) {
      this.addActivity(`Updated field "${oldName}" to "${updates.name}"`);
    }
    return this.data.fields[index];
  },

  deleteField(id) {
    const field = this.data.fields.find(f => f.id === id);
    if (!field) return false;
    
    this.data.fields = this.data.fields.filter(f => f.id !== id);
    this.updateDatabase({ fieldCount: this.data.fields.length });
    this.save();
    this.addActivity(`Deleted field "${field.name}"`);
    return true;
  },

  // Record operations
  getRecords() {
    return this.data.records;
  },

  addRecord(values) {
    const newRecord = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      values
    };
    this.data.records.push(newRecord);
    this.save();
    this.addActivity('Added new record');
    return newRecord;
  },

  updateRecord(id, values) {
    const index = this.data.records.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    this.data.records[index] = { 
      ...this.data.records[index], 
      values,
      updatedAt: new Date().toISOString()
    };
    this.save();
    this.addActivity('Updated record');
    return this.data.records[index];
  },

  deleteRecord(id) {
    this.data.records = this.data.records.filter(r => r.id !== id);
    this.save();
    this.addActivity('Deleted record');
    return true;
  },

  // Activity operations
  getActivities() {
    return this.data.activities.slice(0, 50); // Return last 50 activities
  },

  addActivity(action) {
    const activity = {
      id: uuidv4(),
      action,
      createdAt: new Date().toISOString()
    };
    this.data.activities.unshift(activity);
    this.save();
    return activity;
  },

  // Reset all data
  reset() {
    this.data = { ...defaultData };
    this.init();
    this.addActivity('Reset database');
    return this.data;
  }
};

module.exports = db;

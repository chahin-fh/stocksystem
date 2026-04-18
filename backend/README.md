# FieldBase Backend

Simple Express.js backend for FieldBase with JSON file storage.

## Setup

```bash
npm install
```

## Run

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs on http://localhost:3001

## API Endpoints

### Database
- `GET /api/database` - Get database info
- `PATCH /api/database` - Update database

### Fields
- `GET /api/fields` - List all fields
- `POST /api/fields` - Create field `{name, type, required}`
- `PATCH /api/fields/:id` - Update field
- `DELETE /api/fields/:id` - Delete field

### Records
- `GET /api/records` - List all records
- `POST /api/records` - Create record `{values}`
- `PATCH /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record

### Activities
- `GET /api/activities` - List recent activities

### System
- `POST /api/reset` - Reset all data (for testing)
- `GET /api/health` - Health check

## Data Storage

Data is stored in `data.json` file in the backend directory.

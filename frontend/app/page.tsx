"use client";

import { FormEvent, useMemo, useState } from "react";

type FieldType =
  | "text"
  | "number"
  | "date"
  | "url"
  | "email"
  | "boolean"
  | "textarea";

type FieldDef = {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
};

type RecordItem = {
  id: string;
  createdAt: string;
  values: Record<string, string | boolean>;
};

type Activity = {
  id: string;
  action: string;
  createdAt: string;
};

const FIELD_TYPES: FieldType[] = [
  "text",
  "number",
  "date",
  "url",
  "email",
  "boolean",
  "textarea",
];

export default function Home() {
  const [view, setView] = useState<"onboarding" | "dashboard" | "entry">("onboarding");
  const [step, setStep] = useState(0);
  const [dbName, setDbName] = useState("");
  const [dbDescription, setDbDescription] = useState("");
  const [invites, setInvites] = useState<string[]>([]);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newInvite, setNewInvite] = useState("");
  const [recordValues, setRecordValues] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState("");

  const addActivity = (action: string) => {
    setActivities((prev) => [
      { id: crypto.randomUUID(), action, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  const addField = () => {
    const name = newFieldName.trim();
    if (!name) {
      setError("Field name is required");
      return;
    }
    if (fields.some((field) => field.name.toLowerCase() === name.toLowerCase())) {
      setError("Field already exists");
      return;
    }
    setFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, type: newFieldType, required: newFieldRequired },
    ]);
    setNewFieldName("");
    setNewFieldType("text");
    setNewFieldRequired(false);
    setError("");
  };

  const addInvite = () => {
    const email = newInvite.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      setError("Enter a valid email");
      return;
    }
    if (invites.includes(email)) {
      setError("Email already added");
      return;
    }
    setInvites((prev) => [...prev, email]);
    setNewInvite("");
    setError("");
  };

  const createDatabase = () => {
    if (!dbName.trim()) {
      setStep(0);
      setError("Database name is required");
      return;
    }
    if (fields.length === 0) {
      setStep(1);
      setError("Add at least one field");
      return;
    }
    addActivity(`Created database "${dbName}" with ${fields.length} field(s)`);
    setView("dashboard");
    setError("");
  };

  const metrics = useMemo(() => {
    const requiredFields = fields.filter((field) => field.required);
    const requiredCount = requiredFields.length * Math.max(records.length, 1);
    const filledRequired = records.reduce((acc, record) => {
      const filled = requiredFields.filter((field) => {
        const value = record.values[field.id];
        return value !== "" && value !== undefined && value !== false;
      }).length;
      return acc + filled;
    }, 0);
    const completion = requiredCount === 0 ? 100 : Math.round((filledRequired / requiredCount) * 100);
    return {
      totalRecords: records.length,
      fieldsDefined: fields.length,
      teamMembers: invites.length + 1,
      completionRate: completion,
    };
  }, [fields, invites.length, records]);

  const growthData = useMemo(() => {
    const points = Array.from({ length: 7 }, (_, i) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - i));
      const key = day.toISOString().slice(0, 10);
      const count = records.filter((record) => record.createdAt.slice(0, 10) <= key).length;
      return { label: day.toLocaleDateString(undefined, { weekday: "short" }), value: count };
    });
    const max = Math.max(...points.map((point) => point.value), 1);
    return { points, max };
  }, [records]);

  const fillRateData = useMemo(() => {
    if (records.length === 0) {
      return fields.map((field) => ({ ...field, rate: 0 }));
    }
    return fields.map((field) => {
      const filled = records.filter((record) => {
        const value = record.values[field.id];
        return value !== "" && value !== undefined && value !== false;
      }).length;
      return { ...field, rate: Math.round((filled / records.length) * 100) };
    });
  }, [fields, records]);

  const submitRecord = (event: FormEvent) => {
    event.preventDefault();
    for (const field of fields) {
      if (field.required) {
        const value = recordValues[field.id];
        if (value === "" || value === undefined || value === false) {
          setError(`"${field.name}" is required`);
          return;
        }
      }
    }
    const record: RecordItem = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      values: recordValues,
    };
    setRecords((prev) => [record, ...prev]);
    setRecordValues({});
    addActivity(`Added record #${records.length + 1}`);
    setError("");
    setView("dashboard");
  };

  const stepTitles = [
    "Name your database",
    "Build your schema",
    "Invite your team",
    "Review and create",
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-wrap">
          <div className="brand-dot" />
          <div className="brand-block">
            <div className="brand">FieldBase</div>
            <p className="brand-sub">Custom schema workspace</p>
          </div>
        </div>
        <div className="tabs">
          <button className={`tab ${view === "onboarding" ? "active" : ""}`} onClick={() => setView("onboarding")}>
            Onboarding
          </button>
          <button className={`tab ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
            Dashboard
          </button>
          <button className={`tab ${view === "entry" ? "active" : ""}`} onClick={() => setView("entry")}>
            Add Record
          </button>
        </div>
      </header>

      <main className="app-main">
        {error ? <p className="global-error">{error}</p> : null}

        {view === "onboarding" ? (
          <section className="panel onboarding">
            <div className="onboarding-top">
              <div>
                <p className="step-text">Step {step + 1} of 4</p>
                <h1 className="title">{stepTitles[step]}</h1>
              </div>
              <div className="step-pills">
                {stepTitles.map((_, index) => (
                  <span key={index} className={`pill ${index <= step ? "active" : ""}`}>
                    {index + 1}
                  </span>
                ))}
              </div>
            </div>
            <div className="wizard-progress">
              <span style={{ width: `${((step + 1) / 4) * 100}%` }} />
            </div>

            {step === 0 ? (
              <div className="grid-one">
                <label>Database name *</label>
                <input value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="e.g. Product Catalog" />
                <label>Description</label>
                <textarea
                  rows={3}
                  value={dbDescription}
                  onChange={(e) => setDbDescription(e.target.value)}
                  placeholder="What do you track in this database?"
                />
                <div className="row-end">
                  <button className="btn primary" onClick={() => setStep(1)}>
                    Continue
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <>
                <div className="field-row">
                  <input value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="Field name" />
                  <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as FieldType)}>
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                    />
                    Required
                  </label>
                  <button className="btn" onClick={addField}>
                    Add
                  </button>
                </div>
                <div className="list">
                  {fields.length === 0 ? <div className="empty">No fields yet. Add your first field above.</div> : null}
                  {fields.map((field) => (
                    <div className="item" key={field.id}>
                      <span className="item-strong">{field.name}</span>
                      <span className="tag">{field.type}</span>
                      <span className={field.required ? "required" : "optional"}>{field.required ? "required" : "optional"}</span>
                    </div>
                  ))}
                </div>
                <div className="row-between">
                  <button className="btn" onClick={() => setStep(0)}>
                    Back
                  </button>
                  <button className="btn primary" onClick={() => setStep(2)}>
                    Continue
                  </button>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="invite-row">
                  <input value={newInvite} onChange={(e) => setNewInvite(e.target.value)} placeholder="name@company.com" />
                  <button className="btn" onClick={addInvite}>
                    Add
                  </button>
                </div>
                <div className="list">
                  {invites.length === 0 ? <div className="empty">No invites yet. You can also skip this step.</div> : null}
                  {invites.map((invite) => (
                    <div className="item" key={invite}>
                      <span className="item-strong">{invite}</span>
                      <small className="tag">pending</small>
                    </div>
                  ))}
                </div>
                <div className="row-between">
                  <button className="btn" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button className="btn primary" onClick={() => setStep(3)}>
                    Continue
                  </button>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="summary">
                  <p><strong>Name:</strong> {dbName || "Not set"}</p>
                  <p><strong>Description:</strong> {dbDescription || "No description"}</p>
                  <p><strong>Fields created:</strong> {fields.length}</p>
                  <p><strong>Team invites:</strong> {invites.length}</p>
                </div>
                <div className="row-between">
                  <button className="btn" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button className="btn primary" onClick={createDatabase}>
                    Create Database
                  </button>
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {view === "dashboard" ? (
          <section className="stack">
            <div className="panel dashboard-intro">
              <p className="step-text">Workspace / {dbName || "Untitled Database"}</p>
              <h2 className="title">Database Dashboard</h2>
              <p className="muted">{dbDescription || "No description yet."}</p>
            </div>

            <div className="metrics">
              <div className="metric hero"><p>{metrics.totalRecords}</p><small>Total Records</small></div>
              <div className="metric"><p>{metrics.fieldsDefined}</p><small>Fields Defined</small></div>
              <div className="metric"><p>{metrics.teamMembers}</p><small>Team Members</small></div>
              <div className="metric"><p>{metrics.completionRate}%</p><small>Completion Rate</small></div>
            </div>

            <div className="cols">
              <div className="panel">
                <h3>Record Growth (Last 7 days)</h3>
                <div className="chart-row">
                  {growthData.points.map((point) => (
                    <div key={point.label} className="bar-col">
                      <div className="bar-wrap">
                        <div className="bar" style={{ height: `${(point.value / growthData.max) * 100}%` }} />
                      </div>
                      <small>{point.label}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h3>Field Fill Rate</h3>
                <div className="stack">
                  {fillRateData.map((field) => (
                    <div key={field.id}>
                      <div className="row-between">
                        <small>{field.name}</small>
                        <small>{field.rate}%</small>
                      </div>
                      <div className="progress">
                        <span style={{ width: `${field.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="cols">
              <div className="panel">
                <h3>Activity Feed</h3>
                <div className="list">
                  {activities.length === 0 ? <p className="muted">No activity yet.</p> : null}
                  {activities.map((activity) => (
                    <div className="item" key={activity.id}>
                      <span className="item-strong">{activity.action}</span>
                      <small>{new Date(activity.createdAt).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <h3>Team</h3>
                <div className="list">
                  <div className="item"><span>Owner</span><small>You</small></div>
                  {invites.map((email) => (
                    <div className="item" key={email}>
                      <span>{email}</span>
                      <small>Invited</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {view === "entry" ? (
          <section className="cols">
            <form className="panel" onSubmit={submitRecord}>
              <h2 className="title">Add Record</h2>
              <div className="form-grid">
                {fields.map((field) => (
                  <div key={field.id} className={field.type === "textarea" ? "full" : ""}>
                    <label>
                      {field.name} {field.required ? "*" : ""}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={4}
                        value={String(recordValues[field.id] ?? "")}
                        onChange={(e) => setRecordValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      />
                    ) : field.type === "boolean" ? (
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={Boolean(recordValues[field.id])}
                          onChange={(e) => setRecordValues((prev) => ({ ...prev, [field.id]: e.target.checked }))}
                        />
                        Yes / No
                      </label>
                    ) : (
                      <input
                        type={field.type === "textarea" ? "text" : field.type}
                        value={String(recordValues[field.id] ?? "")}
                        onChange={(e) => setRecordValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="row-between">
                <button type="button" className="btn" onClick={() => setView("dashboard")}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save Record
                </button>
              </div>
            </form>

            <aside className="panel">
              <h3>Schema Summary</h3>
              <div className="list">
                {fields.length === 0 ? <div className="empty">No schema yet. Create fields from onboarding.</div> : null}
                {fields.map((field) => (
                  <div className="item" key={field.id}>
                    <span className="item-strong">{field.name}</span>
                    <small className="tag">{field.type}</small>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        ) : null}
      </main>
    </div>
  );
}

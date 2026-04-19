"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type FieldType = "text" | "number" | "date" | "url" | "email" | "boolean" | "textarea";

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

type DatabaseItem = {
  id: string;
  name: string;
  description: string;
  fieldCount: number;
  createdAt: string;
};

const FIELD_TYPES: FieldType[] = ["text", "number", "date", "url", "email", "boolean", "textarea"];


export default function Home() {

  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);

  const userName = "Fhima";

  const [view, setView] = useState<"onboarding" | "dashboard" | "entry" | "settings" | "allRecords">("onboarding");

  const [settingsTab, setSettingsTab] = useState<"profile" | "database" | "notifications">("profile");

  const [step, setStep] = useState(0);

  const [dbName, setDbName] = useState("");

  const [dbDescription, setDbDescription] = useState("");

  const [isFirstTime, setIsFirstTime] = useState(true);

  const [invites, setInvites] = useState<string[]>([]);

  const [fields, setFields] = useState<FieldDef[]>([]);

  const [records, setRecords] = useState<RecordItem[]>([]);

  const [activities, setActivities] = useState<Activity[]>([]);

  const [database, setDatabase] = useState<DatabaseItem | null>(null);

  const [showNavMenu, setShowNavMenu] = useState(false);


  const [newFieldName, setNewFieldName] = useState("");

  const [newFieldType, setNewFieldType] = useState<FieldType>("text");

  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const [newInvite, setNewInvite] = useState("");

  const [recordValues, setRecordValues] = useState<Record<string, string | boolean>>({});

  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [apiError, setApiError] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("fieldbase_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("fieldbase_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };


  useEffect(() => {
    const savedFields = localStorage.getItem("fieldbase_fields");
    const savedDatabase = localStorage.getItem("fieldbase_database");

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setApiError("");

        // Fetch database
        const dbRes = await fetch(`${API_BASE}/database`, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        if (dbRes.ok) {
          const db = await dbRes.json();
          const isEmptyDb = !db;

          if (isEmptyDb) {
            setDatabase(null);
            setDbName("");
            setDbDescription("");
            setIsFirstTime(true);
            setView("onboarding");
          } else {
            setDatabase(db);
            setDbName(db.name);
            setDbDescription(db.description || "");
            setIsFirstTime(false);
            setView("dashboard");
          }
        }

        // Fetch fields
        const fieldsRes = await fetch(`${API_BASE}/fields`, {
          headers: {
            ...getAuthHeaders(),
          },
        });
        if (fieldsRes.ok) {
          const fieldsData = await fieldsRes.json();
          setFields(fieldsData);
        }

        // Fetch records
        const recordsRes = await fetch(`${API_BASE}/records`);
        if (recordsRes.ok) {
          const recordsData = await recordsRes.json();
          setRecords(recordsData);
        }

        // Fetch activities
        const activitiesRes = await fetch(`${API_BASE}/activities`);
        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setActivities(activitiesData);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setApiError("Failed to connect to backend. Make sure the server is running on port 3001.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);



  // No localStorage effects - all data is managed via API calls


  const addActivity = (action: string) => {
    setActivities((prev) => [
      { id: crypto.randomUUID(), action, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  };


  const addField = async () => {
    const name = newFieldName.trim();
    if (!name) {
      setError("Field name is required");
      return;
    }

    if (fields.some((field) => field.name.toLowerCase() === name.toLowerCase())) {
      setError("Field already exists");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/fields`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, type: newFieldType, required: newFieldRequired }),
      });

      if (response.ok) {
        const newField = await response.json();
        setFields((prev) => [...prev, newField]);
        setNewFieldName("");
        setNewFieldType("text");
        setNewFieldRequired(false);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add field");
      }
    } catch {
      setError("Failed to connect to backend");
    }
  };

  const updateField = async (fieldId: string, updates: Partial<FieldDef>) => {
    try {
      const response = await fetch(`${API_BASE}/fields/${fieldId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedField = await response.json();
        setFields((prev) => prev.map((field) => (field.id === fieldId ? updatedField : field)));
      } else {
        setError("Failed to update field");
      }
    } catch {
      setError("Failed to connect to backend");
    }
  };

  const deleteField = async (fieldId: string) => {
    try {
      const response = await fetch(`${API_BASE}/fields/${fieldId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        setFields((prev) => prev.filter((field) => field.id !== fieldId));
        addActivity("Deleted field");
      } else {
        setError("Failed to delete field");
      }
    } catch {
      setError("Failed to connect to backend");
    }
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


  const handleStep0 = async () => {
    if (!dbName.trim()) {
      setError("Database name is required");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/databases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: dbName.trim(),
          description: dbDescription.trim(),
        }),
      });

      if (response.ok) {
        const createdDb = await response.json();
        setDatabase(createdDb);
        setError("");
        setStep(1);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data?.error || "Failed to initialize database");
      }
    } catch {
      setError("Failed to connect to backend");
    } finally {
      setIsLoading(false);
    }
  };

  const createDatabase = async () => {
    // This is now just the final step to move to dashboard
    setIsFirstTime(false);
    addActivity(`Finalized database "${dbName}"`);
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



  const submitRecord = async (event: FormEvent) => {
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

    try {
      const response = await fetch(`${API_BASE}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: recordValues }),
      });

      if (response.ok) {
        const newRecord = await response.json();
        setRecords((prev) => [newRecord, ...prev]);
        setRecordValues({});
        // Refresh activities from API
        const activitiesRes = await fetch(`${API_BASE}/activities`);
        if (activitiesRes.ok) {
          setActivities(await activitiesRes.json());
        }
        setError("");
        setView("dashboard");
      } else {
        setError("Failed to save record");
      }
    } catch {
      setError("Failed to connect to backend");
    }
  };



  const stepTitles = [

    "Name your database",

    "Build your schema",

    "Invite your team",

    "Review and create",

  ];



  const onLogout = () => {

    setShowNavMenu(false);

    localStorage.removeItem("fieldbase_token");
    localStorage.removeItem("fieldbase_user");
    setAuthChecked(false);
    setView("onboarding");
    setError("");
    addActivity("Logged out");
    router.replace("/login");

  };



  const onProfile = () => {

    setShowNavMenu(false);

    addActivity("Opened profile");

  };





  if (!authChecked) {
    return null;
  }

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

        <div className={`nav-avatar-wrap ${showNavMenu ? "open" : ""}`}>

          <button

            className="nav-avatar-btn"

            onClick={() => setShowNavMenu((prev) => !prev)}

            title={userName}

            aria-label="Open navigation menu"

            aria-expanded={showNavMenu}

          >

            {userName.charAt(0).toUpperCase()}

          </button>

          <ul className="nav-dropdown-menu">

            {!database ? (

              <li>

                <button

                  className="nav-dropdown-item"

                  onClick={() => {

                    setView("onboarding");

                    setShowNavMenu(false);

                  }}

                  tabIndex={showNavMenu ? 0 : -1}

                >

                  Create Database

                </button>

              </li>

            ) : null}

            <li>

              <button

                className="nav-dropdown-item"

                onClick={() => {

                  setView("dashboard");

                  setShowNavMenu(false);

                }}

                tabIndex={showNavMenu ? 0 : -1}

              >

                Dashboard

              </button>

            </li>
            <li>

              <button

                className="nav-dropdown-item"

                onClick={() => {

                  setView("settings");

                  setShowNavMenu(false);

                }}

                tabIndex={showNavMenu ? 0 : -1}

              >

                Settings

              </button>

            </li>

            <li>

              <button

                className="nav-dropdown-item"

                onClick={onProfile}

                tabIndex={showNavMenu ? 0 : -1}

              >

                Profile

              </button>

            </li>

            <li>

              <button

                className="nav-dropdown-item danger"

                onClick={onLogout}

                tabIndex={showNavMenu ? 0 : -1}

              >

                Logout

              </button>

            </li>

          </ul>

        </div>

      </header>



      <main className="app-main">

        {apiError ? <p className="global-error" style={{background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px'}}>{apiError}</p> : null}
        {error ? <p className="global-error">{error}</p> : null}
        {isLoading ? (
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px'}}>
            <div style={{width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
          </div>
        ) : null}



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

                <div className="row-between">


                  <button className="btn primary" onClick={handleStep0}>

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

                  {fields.length === 0 ? <div className="empty">No fields added. Build your schema to track products.</div> : null}

                  {fields.map((field) => (

                    <div className="item" key={field.id}>

                      <div>

                        <span className="item-strong">{field.name}</span>

                        <small className="tag">{field.type}</small>

                        {field.required ? <small className="tag warning">required</small> : null}

                      </div>

                      <button className="btn small danger" onClick={() => deleteField(field.id)}>

                        Remove

                      </button>

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



            <div className="view-actions standalone-actions">

              <button

                className="metric hero view-toggle"

                onClick={() => setView("entry")}

              >

                <p>{records.length}</p>

                <small>Add Record</small>

              </button>

              <button

                className="metric hero view-toggle"

                onClick={() => setView("allRecords")}

              >

                <p>{records.length}</p>

                <small>View All Records</small>

              </button>

            </div>



            <div className="metrics">

              <div className="metric"><p>{metrics.teamMembers}</p><small>Team Members</small></div>
              
              <div className="metric"><p>{metrics.fieldsDefined}</p><small>Fields Defined</small></div>

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

                        type={field.type as Exclude<FieldType, "textarea" | "boolean">}

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



        {view === "settings" && (
          <section className="settings-layout">
            <aside className="settings-sidebar">
              <div className="settings-user">
                <div className="settings-avatar">{userName.charAt(0).toUpperCase()}</div>
                <div className="settings-user-info">
                  <p className="settings-user-name">{userName}</p>
                  <p className="settings-user-email">{userName.toLowerCase()}@example.com</p>
                </div>
              </div>
              <nav className="settings-nav">
                <div className="settings-nav-section">ACCOUNT</div>
                <button
                  className={`settings-nav-item ${settingsTab === "profile" ? "active" : ""}`}
                  onClick={() => setSettingsTab("profile")}
                >
                  Profile
                </button>
                <button
                  className={`settings-nav-item ${settingsTab === "notifications" ? "active" : ""}`}
                  onClick={() => setSettingsTab("notifications")}
                >
                  Notifications
                </button>
                <button
                  className={`settings-nav-item ${settingsTab === "database" ? "active" : ""}`}
                  onClick={() => setSettingsTab("database")}
                >
                  Edit Database
                </button>
              </nav>
            </aside>
            <div className="settings-content">
              {settingsTab === "profile" && (
                <div className="settings-panel">
                  <h2>Profile Settings</h2>
                  <div className="settings-section">
                    <label>Display Name</label>
                    <input type="text" value={userName} readOnly />
                  </div>
                  <div className="settings-section">
                    <label>Email</label>
                    <input type="email" value={`${userName.toLowerCase()}@example.com`} readOnly />
                  </div>
                </div>
              )}
              {settingsTab === "notifications" && (
                <div className="settings-panel">
                  <h2>Notifications</h2>
                  <div className="settings-section">
                    <label className="check">
                      <input type="checkbox" checked readOnly />
                      Email notifications for new records
                    </label>
                  </div>
                </div>
              )}
              {settingsTab === "database" && (
                <div className="settings-panel">
                  <h2>Edit Database</h2>
                  <p className="muted">Manage your database fields. Changes will affect how you enter and view records.</p>
                  <div className="edit-fields-list">
                    {fields.length === 0 ? (
                      <div className="empty">No fields yet. Create fields from the onboarding flow.</div>
                    ) : (
                      fields.map((field) => (
                        <EditFieldItem
                          key={field.id}
                          field={field}
                          onUpdate={updateField}
                          onDelete={deleteField}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {view === "allRecords" ? (
          <section className="stack">
            <div className="panel">
              <div className="row-between">
                <div>
                  <p className="step-text">All Records / {dbName || "Untitled Database"}</p>
                  <h2 className="title">Product Catalog</h2>
                  <p className="muted">{records.length} items in stock</p>
                </div>
                <button className="btn primary" onClick={() => setView("dashboard")}>
                  Back to Dashboard
                </button>
              </div>
            </div>

            <div className="records-grid">
              {records.length === 0 ? (
                <div className="panel empty-state">
                  <h3>No Records Yet</h3>
                  <p>Start by adding your first product to the catalog.</p>
                  <button className="btn primary" onClick={() => setView("entry")}>
                    Add First Record
                  </button>
                </div>
              ) : (
                records.map((record) => (
                  <div key={record.id} className="record-card">
                    <div className="record-card-header">
                      {(() => {
                        const productName = fields.find(f => f.name.toLowerCase().includes('product' ) || f.name.toLowerCase().includes('name'))?.id;
                        const name = productName ? record.values[productName] : 'Untitled Product';
                        return typeof name === 'string' ? name : String(name);
                      })()}
                    </div>
                    <div className="record-card-body">
                      {fields.map((field) => {
                        const value = record.values[field.id];
                        if (!value || value === "" || value === false) return null;
                        
                        if (field.name.toLowerCase().includes('price')) {
                          return (
                            <div key={field.id} className="record-price">
                              ${typeof value === 'string' ? parseFloat(value).toFixed(2) : value}
                            </div>
                          );
                        }
                        
                        if (field.name.toLowerCase().includes('sku')) {
                          return (
                            <div key={field.id} className="record-sku">
                              SKU: {value}
                            </div>
                          );
                        }
                        
                        if (field.name.toLowerCase().includes('category')) {
                          return (
                            <div key={field.id} className="record-category">
                              {value}
                            </div>
                          );
                        }
                        
                        if (field.name.toLowerCase().includes('stock') || field.name.toLowerCase().includes('in stock')) {
                          return (
                            <div key={field.id} className={`record-stock ${value ? 'in-stock' : 'out-of-stock'}`}>
                              {value ? '✓ In Stock' : '✗ Out of Stock'}
                            </div>
                          );
                        }
                        
                        if (field.type === 'textarea' && field.name.toLowerCase().includes('description')) {
                          return (
                            <div key={field.id} className="record-description">
                              {String(value).substring(0, 100)}
                              {String(value).length > 100 && '...'}
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                    <div className="record-card-footer">
                      <small className="record-date">
                        Added {new Date(record.createdAt).toLocaleDateString()}
                      </small>
                      <button className="btn small" onClick={() => setView("entry")}>
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

      </main>

    </div>

  );

}

function EditFieldItem({
  field,
  onUpdate,
  onDelete,
}: {
  field: FieldDef;
  onUpdate: (id: string, updates: Partial<FieldDef>) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(field.name);
  const [editType, setEditType] = useState<FieldType>(field.type);

  const handleSave = () => {
    if (editName.trim()) {
      onUpdate(field.id, { name: editName.trim(), type: editType });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(field.name);
    setEditType(field.type);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="edit-field-item editing">
        <div className="edit-field-inputs">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Field name"
          />
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value as FieldType)}
          >
            {FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="edit-field-actions">
          <button className="btn" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-field-item">
      <div className="edit-field-info">
        <span className="edit-field-name">{field.name}</span>
        <span className="tag">{field.type}</span>
        {field.required && <span className="required">required</span>}
      </div>
      <div className="edit-field-actions">
        <button className="btn" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button className="btn danger" onClick={() => onDelete(field.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}


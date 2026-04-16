"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FieldItem = {
  id: string;
  name: string;
  type: string;
  required: boolean;
};

export default function FieldsPage() {
  const [fields, setFields] = useState<FieldItem[]>([]);

  useEffect(() => {
    const savedFields = localStorage.getItem("fieldbase_fields");
    if (savedFields) {
      setFields(JSON.parse(savedFields));
    }
  }, []);

  return (
    <div className="app-shell">
      <main className="app-main">
        <section className="panel stack">
          <div className="row-between">
            <h1 className="title">All Fields</h1>
            <Link href="/" className="btn">
              Back to dashboard
            </Link>
          </div>
          <div className="list">
            {fields.length === 0 ? <div className="empty">No fields created yet.</div> : null}
            {fields.map((field) => (
              <div className="item" key={field.id}>
                <div>
                  <span className="item-strong">{field.name}</span>
                  <p className="muted">{field.required ? "Required field" : "Optional field"}</p>
                </div>
                <small className="tag">{field.type}</small>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

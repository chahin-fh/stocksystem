"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DatabaseItem = {
  id: string;
  name: string;
  description: string;
  fieldCount: number;
  createdAt: string;
};

export default function DatabasesPage() {
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);

  useEffect(() => {
    const savedDatabases = localStorage.getItem("fieldbase_databases");
    if (savedDatabases) {
      setDatabases(JSON.parse(savedDatabases));
    }
  }, []);

  return (
    <div className="app-shell">
      <main className="app-main">
        <section className="panel stack">
          <div className="row-between">
            <h1 className="title">All Databases</h1>
            <Link href="/" className="btn">
              Back to dashboard
            </Link>
          </div>
          <div className="list">
            {databases.length === 0 ? <div className="empty">No databases created yet.</div> : null}
            {databases.map((database) => (
              <div className="item" key={database.id}>
                <div>
                  <span className="item-strong">{database.name}</span>
                  <p className="muted">{database.description || "No description"}</p>
                </div>
                <small>{database.fieldCount} fields</small>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

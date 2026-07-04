import React, { useEffect, useState } from "react";
import { Link } from "wouter";

interface Complaint {
    id: string;
    customer: string;
    issue: string;
    priority: string;
    status: string;
    sla: string;
}

const SubAdminDashboard: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);

    useEffect(() => {
        // MOCK DATA (later replace with API)
        const mockData: Complaint[] = [];

        setComplaints(mockData);
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <h2>Service Coordinator Dashboard</h2>
            <div style={{ marginTop: "8px", marginBottom: "16px" }}>
                <Link href="/sub-admin/complaints">
                    <button>Open User Complaints</button>
                </Link>
            </div>

            <div className="stats">
                <div className="card">Total Open: {complaints.length}</div>
                <div className="card">Resolved: 121</div>
                <div className="card">SLA Breached: 3</div>
            </div>

            <h3 style={{ marginTop: "20px" }}>All Complaints</h3>

            <table border={1} cellPadding={10} width="100%">
                <thead>
                    <tr>
                        <th>Ticket</th>
                        <th>Customer</th>
                        <th>Issue</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>SLA</th>
                        <th>Action</th>
                    </tr>
                </thead>

                <tbody>
                    {complaints.map((c) => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.customer}</td>
                            <td>{c.issue}</td>
                            <td>{c.priority}</td>
                            <td>{c.status}</td>
                            <td>{c.sla}</td>
                            <td>
                                <button>Assign</button>
                                <button style={{ marginLeft: "10px" }}>Resolve</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SubAdminDashboard;
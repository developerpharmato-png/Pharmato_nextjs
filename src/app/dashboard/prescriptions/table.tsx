import React from 'react';

async function fetchPrescriptions() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/prescriptions`, { cache: 'no-store' });
    const data = await res.json();
    return data.data || [];
}

export default async function PrescriptionsTable() {
    const prescriptions = await fetchPrescriptions();
    return (
        <table className="min-w-full border divide-y">
            <thead className="bg-gray-100">
                <tr>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Patient</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Doctor</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Medicines</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Status</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Issued</th>
                </tr>
            </thead>
            <tbody>
                {prescriptions.map((p: any) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">{p.patientName}</td>
                        <td className="px-3 py-2 text-sm">{p.doctorName}</td>
                        <td className="px-3 py-2 text-sm">{p.medicines?.length}</td>
                        <td className="px-3 py-2 text-sm">{p.status}</td>
                        <td className="px-3 py-2 text-sm">{new Date(p.dateIssued).toLocaleDateString()}</td>
                    </tr>
                ))}
                {prescriptions.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">No prescriptions found.</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
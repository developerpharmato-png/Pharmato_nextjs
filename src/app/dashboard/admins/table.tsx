import React from 'react';

async function fetchAdmins() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admins`, { cache: 'no-store' });
    const data = await res.json();
    return data.data || [];
}

export default async function AdminsTable() {
    const admins = await fetchAdmins();
    return (
        <table className="min-w-full border divide-y">
            <thead className="bg-gray-100">
                <tr>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Name</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Email</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Role</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Created</th>
                </tr>
            </thead>
            <tbody>
                {admins.map((a: any) => (
                    <tr key={a._id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm">{a.name}</td>
                        <td className="px-3 py-2 text-sm">{a.email}</td>
                        <td className="px-3 py-2 text-sm">{a.role}</td>
                        <td className="px-3 py-2 text-sm">{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                ))}
                {admins.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">No admins found.</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

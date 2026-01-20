"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminCustomerDetailTabs from './Tabs';

export default function AdminCustomerDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    return <AdminCustomerDetailTabs id={id} />;
}
 
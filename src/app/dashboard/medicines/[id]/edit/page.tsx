import EditFormClient from './EditFormClient';

export default function Page({ params }: { params: { id: string } }) {
    const { id } = params;
    return <EditFormClient id={id} />;
}


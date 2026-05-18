'use client';

import { use } from 'react';
import { TicketDetailPage } from '@/components/ticket-detail';

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TicketDetailPage ticketId={id} />;
}

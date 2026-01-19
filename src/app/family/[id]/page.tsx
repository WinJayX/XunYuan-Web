'use client';

import { use } from 'react';
import { FamilyProvider } from '@/context/FamilyContext';
import FamilyTree from '@/components/FamilyTree';
import { useRouter } from 'next/navigation';

export default function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);

    return (
        <FamilyProvider familyId={resolvedParams.id}>
            <FamilyTree onBack={() => router.push('/')} />
        </FamilyProvider>
    );
}

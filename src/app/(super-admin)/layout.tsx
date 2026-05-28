'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSAAuthStore } from '@/store/super-admin-auth.store';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const isAuth   = useSAAuthStore((s) => s.isAuth);

  const isLoginPage = pathname === '/super-admin/login';

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuth && !isLoginPage) router.replace('/super-admin/login');
    if (isAuth  &&  isLoginPage) router.replace('/super-admin/tenants');
  }, [mounted, isAuth, isLoginPage, router]);

  if (!mounted) return null;
  if (!isAuth && !isLoginPage) return null;

  return <>{children}</>;
}

import { redirect } from 'next/navigation';

export default function VendorsRedirectPage() {
  redirect('/dashboard/admin-panel/hospitals');
}
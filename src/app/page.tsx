import { redirect } from 'next/navigation';

// For this demo, we'll redirect to the dashboard by default.
// In a real app, you would have logic here to check if the user is authenticated.
export default function Home() {
  redirect('/login');
}

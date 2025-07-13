import { redirect } from 'next/navigation';

// Redirect users from /docs to the main documentation page

export default function DocsRedirectPage() {
  redirect('/documentation');
}


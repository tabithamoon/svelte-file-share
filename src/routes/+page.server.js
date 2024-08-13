import { redirect } from '@sveltejs/kit';

export function load({ cookies }) {
    const login = cookies.get('login');
    if (login !== undefined) redirect(307, '/upload')
}
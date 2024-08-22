import { redirect } from '@sveltejs/kit';

export function load({ cookies, url }) {
    const login = cookies.get('login');
    const logout = url.searchParams.get('logout');

    if (logout != null) {
        cookies.set('login', '', {
            path: '/',
            httpOnly: true,
            maxAge: 0,
            secure: true,
            sameSite: true
        });
        return;
    }
    if (login != null && login != '') redirect(307, '/upload')
}
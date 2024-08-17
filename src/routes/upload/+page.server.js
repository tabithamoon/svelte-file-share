import { error } from '@sveltejs/kit';

function bail(cookies) {
    cookies.delete('login', { path: '/' });
    return error(401, 'Unauthorized');
}

export async function load({ cookies, platform }) {
    const secret = platform.env.SECRET;
    const token = cookies.get('login');

    if (token === undefined || token !== secret) bail(cookies)
}

export const actions = {
    default: async ({ cookies, request, platform }) => {
        const formData = await request.formData();
        const token = formData.get('secret');
        const secret = platform.env.SECRET;

        if (token === undefined || token !== secret) bail(cookies)

        cookies.set('login', token, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
            secure: true,
            sameSite: true
        });
    }
}
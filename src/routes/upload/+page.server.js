import { error, fail, redirect } from '@sveltejs/kit';
import { v4 as uuid } from 'uuid';

function bail(cookies) {
    cookies.delete('login', { path: '/' });
    error(401, 'Unauthorized');
}

export async function load({ cookies, platform }) {
    const login = cookies.get('login');
    console.log(login)
    if (login === undefined) bail(cookies)

    const token = await platform.env.LOGIN_TOKENS.get(login);
    console.log(token)
    if (token === undefined) bail(cookies)
}

export const actions = {
    default: async ({ cookies, request, platform }) => {
        const formData = await request.formData();
        const secret = formData.get('secret');
        console.log(secret)

        if (!secret || secret === 'undefined')
            return fail(400, {
                error: true,
                message: 'Secret is missing.'
            });

        if (secret !== platform.env.SECRET)
            return fail (401, {
                error: true,
                message: 'Secret is not valid.'
            });

        const token = uuid();
        const timestamp = new Date();

        try {
            await platform.env.LOGIN_TOKENS.put(token, timestamp.toISOString(), {expirationTtl: 3600});
            cookies.set('login', token, {
                path: '/',
                httpOnly: true,
                maxAge: 3600,
                secure: true,
                sameSite: true
            });
        }
        catch {
            return fail(500, {
                error: true,
                message: 'Failed to set login token.'
            })
        }
    }
}
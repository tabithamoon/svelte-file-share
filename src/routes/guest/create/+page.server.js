import { error } from '@sveltejs/kit';

// Kick out user if token not set
function bail(cookies) {
    cookies.delete('login', { path: '/' });
    return error(401, 'Unauthorized');
}

export async function load({ cookies, platform }) {
    // Get platform bindings and cookie token
    const secret = platform.env.SECRET;
    const token = cookies.get('login');

    // Kick out if password token wrong or missing
    if (token === undefined || token !== secret) bail(cookies);

    // Return login token to frontend
    return { token: token };
}
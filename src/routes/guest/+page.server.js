import { error } from '@sveltejs/kit';

// Kick out user if token not set
function bail(cookies) {
    cookies.delete('login', { path: '/' });
    return error(401, 'Unauthorized');
}

export async function load({ cookies, platform }) {
    // Get platform bindings and cookie token
    const kv = platform.env.GUEST_KEYS;
    const secret = platform.env.SECRET;
    const token = cookies.get('login');

    // Kick out if password token wrong or missing
    if (token === undefined || token !== secret) bail(cookies);

    // Grab existing guest keys from KV
    const keys = await kv.list();

    // Create array to hold link details
    let links = [];

    // Get info for each key and append to array
    for (const key of keys.keys) {
        const link = JSON.parse(await kv.get(key.name))
        link["key"] = key.name;
        links.push(link);
    }

    // Return them to frontend
    return { token: token, links: links };
}
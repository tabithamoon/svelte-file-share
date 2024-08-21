import { error } from '@sveltejs/kit';

// Kick out user if token not set
function bail(cookies) {
    cookies.delete('login', { path: '/' });
    return error(401, 'Unauthorized');
}

export async function load({ cookies, platform }) {
    // Get platform bindings and cookie token
    const bucket = platform.env.MAIN_BUCKET;
    const secret = platform.env.SECRET;
    const token = cookies.get('login');

    // Kick out if password token wrong or missing
    if (token === undefined || token !== secret) bail(cookies);

    const files = await bucket.list({ include: ['customMetadata'] });
    const fileList = files.objects.map(x => ({
        key: x.key,
        size: x.size,
        guest: x.customMetadata.guest,
        ip: x.customMetadata.uploaderIp,
        expiry: x.customMetadata.expiryDate
    }));

    return { token: token, files: fileList };
}

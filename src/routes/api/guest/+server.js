import { json, text } from '@sveltejs/kit';

export async function PUT({ request, platform }) {
    // Get Cloudflare bindings
    const kv = platform.env.GUEST_KEYS;
    const secret = platform.env.SECRET;

    // Create object to hold parameters for request
    const command = {
        token: request.headers.get('authorization'),
        expiry: request.headers.get('x-link-expiry')
    };

    // Bail if shared secret is not correct
    if (command.token !== secret) {
        return json(
            { error: true, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Generate new UUID for guest key
    const uuid = crypto.randomUUID();

    console.log(command);

    // Store guest key in KV
    await kv.put(
        uuid,
        await request.text(),
        { expiration: command.expiry }
    );

    return text(
        uuid,
        { status: 201 }
    );
}

export async function DELETE({ request, platform }) {
    // Get Cloudflare bindings
    const kv = platform.env.GUEST_KEYS;
    const secret = platform.env.SECRET;

    // Create object to hold parameters for request
    const command = {
        token: request.headers.get('authorization'),
        key: request.headers.get('x-key-id')
    };

    // Bail if shared secret is not correct
    if (command.token !== secret) {
        return json(
            { error: true, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Delete key from KV
    await kv.delete(command.key);

    return json(
        { error: false, message: null},
        { status: 200 }
    );
}
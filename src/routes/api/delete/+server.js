import { json } from '@sveltejs/kit';

export async function DELETE({ request, platform }) {
    // Debug flag
    const debug = true;

    // Get Cloudflare bindings
    const bucket = platform.env.MAIN_BUCKET;
    const secret = platform.env.SECRET;

    // Create object to hold parameters for request
    const command = {
        token: request.headers.get('authorization'),
        name: request.headers.get('x-file-name')
    };

    if (debug) console.log(command)

    // Bail if shared secret is not correct
    if (command.token !== secret) {
        return json(
            { error: true, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Bail if the file name is invalid
    if (command.name == null || command.name == '') {
        return json(
            { error: true, message: 'File name missing' },
            { status: 400 }
        );
    }

    // Check if file exists
    const file = await bucket.head(command.name);
    if (debug) console.log(file);
    if (file === null) {
        return json(
            { error: true, message: 'File does not exist' },
            { status: 400 }
        );
    }

    // Delete file
    const deleted = await bucket.delete(command.name);
    if (debug) console.log(deleted);
    
    return json({ error: false, message: null });
}
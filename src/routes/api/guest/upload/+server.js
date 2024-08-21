import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
    // Debug flag
    const debug = true;

    // Get Cloudflare bindings
    const bucket = platform.env.MAIN_BUCKET;
    const kv = platform.env.GUEST_KEYS;

    // Create object to hold parameters for request
    const command = {
        token: request.headers.get('authorization'),
        id: request.headers.get('x-upload-id'),
        name: request.headers.get('x-file-name'),
        expiry: request.headers.get('x-expire-time'),
        action: request.headers.get('x-upload-action'),
        address: request.headers.get('cf-connecting-ip')
    };

    if (debug) console.log(command);
    
    // Get guest link info
    const rawGuest = await kv.get(command.token);

    // Bail if guest does not exist
    if (rawGuest === null) {
        return json(
            { error: true, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Create guest object
    const guest = JSON.parse(rawGuest);

    // Bail if the file name is invalid
    if (command.name == null || command.name == '') {
        return json(
            { error: true, message: 'File name missing' },
            { status: 400 }
        );
    }

    // Main logic, create or complete a multipart upload based on "X-Upload-Action" header
    switch(command.action) {
        case 'create': // Create a multipart upload
            try {
                // Create and immediately return multipart upload details
                return json(
                    await bucket.createMultipartUpload(
                        command.name, {
                            customMetadata: {
                                "uploaderIp": command.address,
                                "expiryDate": command.expiry,
                                "guest": "true"
                            }
                        }
                    ),
                    { status: 201 }
                );
            }
            catch (e) {
                return json(
                    { error: true, message: e },
                    { status: 500 }
                );
            }
        
        case 'complete': // Complete a multipart upload
            try {
                // Resume multipart upload
                const upload = await bucket.resumeMultipartUpload(command.name, command.id);
                const bucketResponse = await upload.complete(await request.json())

                guest.uploads--;
                if(guest.uploads == 0) await kv.delete(command.token);
                else {
                    await kv.put(
                        command.token,
                        JSON.stringify(guest),
                        { expiration: guest.expiry }
                    );
                }

                // Return completed upload details
                return json(
                    bucketResponse
                );
            }
            catch (e) {
                return json(
                    { error: true, message: e },
                    { status: 500 }
                );
            }

        default: // Return an error if there is no action defined
            return json(
                { error: true, message: 'No action provided' },
                { status: 400 }
            );
    }
}

export async function PUT({ request, platform }) {
    // Debug flag
    const debug = true;

    // Get Cloudflare bindings
    const bucket = platform.env.MAIN_BUCKET;
    const kv = platform.env.GUEST_KEYS;

    // Create object to hold parameters for request
    const command = {
        token: request.headers.get('authorization'),
        id: request.headers.get('x-upload-id'),
        name: request.headers.get('x-file-name'),
        part: request.headers.get('x-upload-part'),
        expiry: request.headers.get('x-expire-time'),
        action: request.headers.get('x-upload-action'),
        address: request.headers.get('cf-connecting-ip')
    };

    if (debug) console.log(command);

    // Get guest link info
    const rawGuest = await kv.get(command.token);

    // Bail if guest does not exist
    if (rawGuest === null) {
        return json(
            { error: true, message: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Create guest object
    const guest = JSON.parse(rawGuest);

    // Bail if the file name is invalid
    if (command.name == null || command.name == '') {
        return json(
            { error: true, message: 'File name missing' },
            { status: 400 }
        );
    }

    // Main logic, switch between single request or chunked upload based on "X-Upload-Action" header
    switch (command.action) {
        case 'direct': // <96MB upload, send in single request
            try {
                // Directly place file in bucket in a single chunk
                const bucketResponse = await bucket.put(
                    command.name, // File name
                    request.body, // File data
                    {
                        // Add info about the upload attached to object itself
                        customMetadata: {
                            "uploaderIp": command.address,
                            "expiryDate": command.expiry,
                            "guest": "true"
                        }
                    }
                );

                guest.uploads--;
                if(guest.uploads == 0) await kv.delete(command.token);
                else {
                    kv.put(
                        command.token,
                        JSON.stringify(guest),
                        { expiration: guest.expiry }
                    );
                }

                return json(
                    bucketResponse,
                    { status: 201 }
                );
            }
            catch (e) {
                return json(
                    { error: true, message: e },
                    { status: 500 }
                );
            }
        
        case 'add-part': // Add part to existing multipart upload
            try {
                // Resume ongoing chunked upload
                const upload = await bucket.resumeMultipartUpload(command.name, command.id);

                // Add new part to upload
                return json(
                    await upload.uploadPart(command.part, request.body)
                );
            }
            catch (e) {
                return json(
                    { error: true, message: e },
                    { status: 500 }
                );
            }
        
        default: // Return an error if there is no action defined
            return json(
                { error: true, message: 'No action provided' },
                { status: 400 }
            );
    }
}
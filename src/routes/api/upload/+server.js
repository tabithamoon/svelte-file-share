import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
    // Debug flag
    const debug = true;

    // Get Cloudflare bindings
    const bucket = platform.env.MAIN_BUCKET;
    const secret = platform.env.SECRET;

    // Create object to hold parameters for request
    const command = {
        token: request.headers.get('authorization'),
        id: request.headers.get('x-upload-id'),
        name: request.headers.get('x-file-name'),
        expiry: request.headers.get('x-expire-time'),
        action: request.headers.get('x-upload-action'),
        address: request.headers.get('cf-connecting-ip')
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
                                "uploadDate": new Date().toISOString(),
                                "expiryDate": command.expiry,
                                "guest": "false" //TODO: implement guest links
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

                // Return completed upload details
                return json(
                    await upload.complete(await request.json())
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

export async function PUT({ request, platform, event }) {
    // Debug flag
    const debug = true;

    // Get Cloudflare bindings
    const bucket = platform.env.MAIN_BUCKET;
    const secret = platform.env.SECRET;

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

    // Main logic, switch between single request or chunked upload based on "X-Upload-Action" header
    switch (command.action) {
        case 'direct': // <96MB upload, send in single request
            try {
                // Directly place file in bucket in a single chunk
                return json(
                    await bucket.put(
                        command.name, // File name
                        request.body, // File data
                        {
                            // Add info about the upload attached to object itself
                            customMetadata: {
                                "uploaderIp": command.address,
                                "uploadDate": new Date().toISOString(),
                                "expiryDate": command.expiry,
                                "guest": "false" // TODO: implement guest links
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
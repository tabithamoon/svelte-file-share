import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
    const bucket = platform.env.MAIN_BUCKET
    const secret = platform.env.SECRET

    const fileName = request.headers.get('x-file-name')
    const action = request.headers.get('x-upload-action')
    const token = request.headers.get('authorization')

    if (token !== secret) {
        return json({ error: true, message: 'Unauthorized'}, { status: 401 })
    }

    if (fileName == null || fileName === '') {
        return json(
            { error: true, message: 'File name not provided'},
            { status: 400 }
        )
    }

    switch (action) {
        case 'create':
            try {
                const mpUpload = await bucket.createMultipartUpload(fileName);
                return json(
                    {
                        key: mpUpload.key,
                        uploadId: mpUpload.uploadId
                    }
                )
            }
            catch (e) {
                console.error(e);
                return json(
                    { error: true, message: 'Failed to create bucket upload.' },
                    { status: 500 }
                )
            }

        case 'complete':
            try {
                const uploadId = request.headers.get("x-upload-id");
                const mpUpload = await bucket.resumeMultipartUpload(fileName, uploadId);

                await mpUpload.complete(JSON.parse(request.body))
            }
            catch (e) {
                console.error(e)
                return (
                    { error: true, message: 'Failed to complete multipart upload.' },
                    { status: 500 }
                );
            }

        default:
            return json(
                { error: true, message: 'Action not provided'}, 
                { status: 400 }
            )
    }
}

export async function PUT({ request, platform }) {
    const bucket = platform.env.MAIN_BUCKET
    const secret = platform.env.SECRET

    const fileName = request.headers.get('x-file-name')
    const action = request.headers.get('x-upload-action')
    const token = request.headers.get('authorization')
    
    console.log(token)
    console.log(secret)
    if (token !== secret) {
        return json({ error: true, message: 'Unauthorized'}, { status: 401 })
    }

    if (fileName == null || fileName === '') {
        return json(
            { error: true, message: 'File name not provided'},
            { status: 400 }
        )
    }

    switch (action) {
        case 'direct':
            try {
                return json(await bucket.put(fileName, request.body));
            } catch (e) {
                console.error(e)
                return json(
                    { error: true, message: 'Failed to upload file.' },
                    { status: 500 }
                );
            }
        
        case 'add-part':
            try {
                const uploadId = request.headers.get("x-upload-id");
                const partNumber = request.headers.get("x-upload-part");

                const mpUpload = await bucket.resumeMultipartUpload(fileName, uploadId)
                return json(await mpUpload.uploadPart(partNumber, request.body));
            } catch (e) {
                console.error(e)
                return json(
                    { error: true, message: 'Failed to upload part'},
                    { status: 500 }
                );
            }

        default:
            return json(
                { error: true, message: 'Action not provided'}, 
                { status: 400 }
            )
    }
}
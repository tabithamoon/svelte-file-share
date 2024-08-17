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
            catch {
                return json(
                    { error: true, message: 'Failed to create bucket upload.' },
                    { status: 500 }
                )
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
                console.log(await bucket.put(fileName, request.body));
                return json({ error: false, message: 'Success' })
            } catch {
                return json(
                    { error: true, message: 'Failed to upload file.' },
                    { status: 500 }
                )
            }

        default:
            return json(
                { error: true, message: 'Action not provided'}, 
                { status: 400 }
            )
    }
}
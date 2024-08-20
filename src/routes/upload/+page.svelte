<script>
    // Imports
	import axios from 'axios';

    let files;                          // selected files to upload
    export let data;                    // data from backend
    export let uploadProgress;          // user facing upload progress percentage

    // Main upload function
    const uploadFiles = async () => {
        // Static vars
        const chunkSize = 100663296;    // 96MB (in bytes)
        const token = data.token;       // Auth token (from cookies)
        const debug = true;             // Enable debug logging in console
        
        // A unified "response" variable, for API requests
        let response = undefined;

        // TODO: stub, implement setting expiry date
        let expiryDate = new Date();
        expiryDate.setTime(expiryDate.getTime() + 86400000); // 1 day (in ms)
        if (debug) console.log(`Upload expiry time: ${expiryDate.toISOString()}`);

        // Set some "unified" headers that are
        // shared between chunked and standard upload
        let headers = {
            "Authorization": token,
            "X-Expire-Time": expiryDate.toISOString()
        }

        // Iterate over every selected file
        for (const file of files) {
            if (debug) console.log(file);

            // Set file name for this upload
            headers["X-File-Name"] = file.name;

            // Use multipart upload if file size > chunk size
            if (file.size > chunkSize) {
                if (debug) console.log(`File size (${file.size}) larger than chunk size (${chunkSize}), using chunked upload`);

                // Set upload action to create multipart upload
                headers["X-Upload-Action"] = "create";

                // Create a multipart upload
                response = await axios.post(
                    "/api/upload",
                    null,
                    {
                        headers: headers
                    }
                );

                // End early if response is not Created
                if (response.status !== 201) {
                    console.error(`Failed to create multipart upload: ${response.data}`);
                    return;
                }

                // Discard rest of response info to simplify
                response = response.data;
                if (debug) console.log(`Multipart upload created: ${response}`);

                
                headers["X-Upload-Action"] = "add-part"; // Set upload action to add part to chunked upload
                headers["X-Upload-Id"] = response.uploadId; // Set upload ID header

                let part = 1;           // Current part number
                let offset = 0;         // Current offset from file start
                let partsList = [];     // Keep track of list of parts to complete upload 

                // Main chunked upload loop
                // Until the offset moves beyond the end of the file...
                while (offset < file.size) {
                    if (debug) console.log(`Uploading chunk ${part}, range ${offset} -> ${offset + chunkSize}`);
                    
                    // Set current chunk header
                    headers["X-Upload-Part"] = part;

                    // Upload chunk request
                    response = await axios.put(
                        '/api/upload',
                        file.slice(offset, offset + chunkSize),
                        {
                            headers: headers,
                            onUploadProgress: (progressEvent) => {
                                const { loaded } = progressEvent;
                                uploadProgress = Math.floor(((offset + loaded) * 100) / file.size);
                                if (debug) console.log(`Upload progress: ${(offset + loaded)} out of ${file.size}`);
                            }
                        }
                    );

                    if (response.status !== 200) {
                        console.error(`Uploading file part error: ${response.data}`);
                        return;
                    }

                    partsList.push(response.data);  // Add R2UploadedPart object to array to complete upload later
                    offset = offset + chunkSize;    // Set new offset after upload completed
                    part++;                         // Increment part number
                }

                // Set upload action to complete multipart upload
                headers["X-Upload-Action"] = "complete";

                // Complete multipart upload
                response = await axios.post(
                    '/api/upload',
                    partsList,
                    {
                        headers: headers
                    }
                )

                // Error out if response is not OK
                if (response.status !== 200) {
                    console.error(`Failed to complete multipart upload: ${response.data}`);
                    return;
                }
            }

            // File size < chunk size, send in one request
            else {
                if (debug) console.log(`File size (${file.size}) smaller than chunk size (${chunkSize}), using single request upload`);

                // Set upload action to single request upload
                headers["X-Upload-Action"] = "direct";
                
                if (debug) console.log(headers);

                // Make upload
                response = await axios.put(
                    "/api/upload",
                    file,
                    {
                        headers: headers,
                        onUploadProgress: (progressEvent) => {
                            const { loaded, total } = progressEvent;
                            uploadProgress = Math.floor((loaded * 100) / total);
                            if (debug) console.log(`Upload progress: ${loaded} out of ${total}`);
                        },
                    }
                );

                if (debug) console.log(response);

                // Error out if status is not Created
                if (response.status !== 201) {
                    console.error(`Upload failed: ${response.data}`);
                    return;
                }
            }
        }

        // TODO: (better) user UI confirmation
        alert("upload success!");
    }
</script>

<input type="file" bind:files on:change={uploadFiles}/>
<p>{uploadProgress}</p>
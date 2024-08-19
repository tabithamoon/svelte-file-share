<script>
    export let data;
    let files;

    const uploadFiles = async () => {
        const chunkSize = 100663296 // 96MB (in bytes)
        const token = data.token

        for (const file of files) {
            console.log(file);
            if (file.size > chunkSize) {
                console.log("chunked upload");
                
                let start = 0;
                let partNumber = 1;
                let upload = undefined;
                const headers = new Headers();

                // Set unified headers
                headers.set("Authorization", token);
                headers.set("X-File-Name", "1d/" + file.name);

                // Create multipart upload
                headers.set("X-Upload-Action", "create");
                try {
                    upload = JSON.parse(await fetch("/api/upload", {
                        method: 'POST',
                        headers: headers
                    }));
                }
                catch (e) {
                    console.error(`Failed to connect to API: ${e}`);
                }

                if (upload.error) {
                    console.error(upload.message);
                    return
                }

                // Set upload ID header and add-part action
                headers.set("X-Upload-Id", upload.uploadId);
                headers.set("X-Upload-Action", "add-part");

                // Main upload loop
                let uploadedParts = [];
                while (start < file.size) {
                    console.log(`uploading chunk ${partNumber}`);

                    headers.set("X-Upload-Part", partNumber);

                    uploadedParts.append(JSON.parse(await fetch("/api/upload", {
                        method: 'PUT',
                        headers: headers,
                        body: file.slice(start, start + chunkSize)
                    })));
                    start += chunkSize;
                    partNumber++;
                }

                // Complete multipart upload
                headers.set("X-Upload-Action", "complete");
                let completeResult = JSON.parse(await fetch("/api/upload", {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(uploadedParts)
                }))
            }
            else {
                console.log("direct upload");

                const headers = new Headers();
                headers.set("Authorization", token);
                headers.set("X-File-Name", "1d/" + file.name);
                headers.set("X-Upload-Action", "direct");

                const result = await fetch('/api/upload', {
                    method: 'PUT',
                    body: file,
                    headers: headers
                });

                console.log(result);
            }
        }
    }
</script>

<input type="file" bind:files on:change={uploadFiles}/>
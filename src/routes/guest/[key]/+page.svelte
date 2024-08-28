<title>tabbynet files - upload</title>

<script>
    // Imports
	import axios from 'axios';

    let files;                          // selected files to upload
    let expiryDate;                     // Store selected expiration date
    export let data;                    // data from backend
    const debug = true;                 // Enable debug logging in console
    let uploadProgress;                 // user facing upload progress percentage
    let currentFile = "";               // current file being uploaded
    let uploading = false;              // upload state
    let textCopied = false;             // Show or hide the "Copied!" message
    let uploadFinished = false;         // Set when all files finished upload

    if (debug) console.log(data);

    // Function to format file sizes
    // Credit to https://stackoverflow.com/a/42408230
    function shortenBytes(n) {
        const k = n > 0 ? Math.floor((Math.log2(n)/10)) : 0;
        const rank = (k > 0 ? 'KMGT'[k - 1] : '') + 'B';
        const count = Math.floor(n / Math.pow(1024, k));
        return count + rank;
    }

    // Main upload function
    const uploadFiles = async () => {
        // Stop user if they're trying to upload more files than the link allows
        if (files.length > data.uploads) {
            alert(`You cannot upload that many files, your link only allows for up to ${data.uploads} uploads.`);
            return;
        }

        // Set uploading flag for UI
        uploading = true;

        // Static vars
        const chunkSize = 100663296;    // 96MB (in bytes)
        const token = data.token;       // Auth token (from cookies)
        
        // A unified "response" variable, for API requests
        let response = undefined;

        // Calculate expiration date otherwise
        const days = expiryDate;
        expiryDate = new Date();
        expiryDate.setTime(expiryDate.getTime() + (86400000 * days));
        expiryDate = expiryDate.getTime();

        // Set some "unified" headers that are
        // shared between chunked and standard upload
        let headers = {
            "Authorization": token,
            "X-Expire-Time": expiryDate
        }

        // Iterate over every selected file
        for (const file of files) {
            if (debug) console.log(file);

            // Set currently uploading file for UI
            currentFile = file.name;

            // Set file name for this upload
            headers["X-File-Name"] = file.name;

            // Use multipart upload if file size > chunk size
            if (file.size > chunkSize) {
                if (debug) console.log(`File size (${file.size}) larger than chunk size (${chunkSize}), using chunked upload`);

                // Set upload action to create multipart upload
                headers["X-Upload-Action"] = "create";

                // Create a multipart upload
                response = await axios.post(
                    "/api/guest/upload",
                    null,
                    {
                        headers: headers
                    }
                );

                // End early if response is not Created
                if (response.status !== 201) {
                    alert(`Failed to create multipart upload: ${response.data}`);
                    location.reload();
                }

                // Discard rest of response info to simplify
                response = response.data;
                if (debug) console.log(`Multipart upload created: ${response.uploadId}`);

                
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
                    try {
                        response = await axios.put(
                            '/api/guest/upload',
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
                    }
                    catch {
                        // Cancel multipart upload
                        headers["X-Upload-Action"] = 'cancel';
                        await axios.post(
                            '/api/guest/upload',
                            null,
                            {
                                headers: headers
                            }
                        );

                        // Alert user and stop execution
                        alert(`Upload failed.`);
                        location.reload();
                    }

                    if (response.status !== 200) {
                        // Cancel multipart upload
                        headers["X-Upload-Action"] = 'cancel';
                        await axios.post(
                            '/api/guest/upload',
                            null,
                            {
                                headers: headers
                            }
                        );

                        // Alert user and stop execution
                        alert(`Upload failed.`);
                        location.reload();
                    }

                    partsList.push(response.data);  // Add R2UploadedPart object to array to complete upload later
                    offset = offset + chunkSize;    // Set new offset after upload completed
                    part++;                         // Increment part number
                }

                // Set upload action to complete multipart upload
                headers["X-Upload-Action"] = "complete";

                // Complete multipart upload
                response = await axios.post(
                    '/api/guest/upload',
                    partsList,
                    {
                        headers: headers
                    }
                )

                // Error out if response is not OK
                if (response.status !== 200) {
                    alert(`Failed to complete multipart upload: ${response.data}`);
                    
                    // Try to cancel upload
                    headers["X-Upload-Action"] = 'cancel';
                    await axios.post(
                        '/api/guest/upload',
                        null,
                        {
                            headers: headers
                        }
                    );

                    location.reload();
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
                    "/api/guest/upload",
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
                    alert(`Upload failed: ${response.data}`);
                    location.reload();
                }
            }
        }

        // Set upload finished flag
        uploadFinished = true;        
    };

    // Function to open hidden file picker input
    const openFilePicker = () => {
        if (debug) console.log("Opening file picker");
        document.getElementById("filePicker").click();
    };

    // Function to reset variables after uploads completed
    const resetPage = () => {
        if (debug) console.log("Resetting page");
        location.reload();
    };

    const copyLink = (fileName) => {
        if (debug) console.log(fileName);
        // Push link to clipboard and display "Copied!" message
        navigator.clipboard.writeText(`https://files.tabbynet.com/${fileName}`);
        textCopied = true;

        // Reset variable and hide the text after 2 seconds
        setTimeout(() => {textCopied = false;}, 2000);
    };
</script>

<div class="flex flex-col m-auto text-center">
    {#if !uploading} <!-- Show file picker UI if not uploading-->
        <input id="filePicker" type="file" bind:files class="hidden" multiple/>
        
        {#if files}
            <table class="border border-slate-950 bg-slate-700">
                <tr class="font-semibold bg-slate-600">
                    <th>Name</th>
                    <th>Size</th>
                </tr>
                {#each files as { name, size }, i}
                    <tr class="border border-slate-950">
                        <td class="px-8">{name}</td>
                        <td class="px-8">{shortenBytes(size)}</td>
                    </tr>
                {/each}
            </table>
            <div class="flex mt-4">
                <button class="px-2 mr-auto rounded-lg border border-slate-950 bg-slate-700" on:click={openFilePicker}>Reselect files</button>
                <p class="self-center mr-2 ml-8 text-sm italic text-slate-500">Expiry time</p>
                <select class="px-2 rounded-lg border w-30 border-slate-950 bg-slate-700" bind:value={expiryDate}>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                </select>
                <button class="px-2 ml-4 rounded-lg border border-slate-950 bg-slate-700" on:click={uploadFiles}>Upload</button>
            </div>
        {:else}
            <button class="px-2 mx-auto w-60 rounded-lg border border-slate-950 bg-slate-700" on:click={openFilePicker}>Select files</button>
            <p class="text-sm italic text-slate-500">Expiration: {new Date(data.expiry * 1000).toLocaleString()}</p>
            <p class="text-sm italic text-slate-500">Uploads left: {data.uploads}</p>
        {/if}
    {:else if !uploadFinished} <!-- Hide everything and only show upload progress if uploading -->
        <p>Uploading file: {currentFile}</p>
        <div class="overflow-hidden p-1 rounded-lg bg-slate-700">
            <div class="flex relative justify-center items-center h-6">
                <div class="relative text-sm font-medium text-white">{uploadProgress}%</div>
            </div>
        </div>
    {:else} <!-- Show share links when upload completed-->
        <p class="text-xl">Upload completed!</p>
        {#if textCopied}
            <p class="mb-4 text-sm italic text-green-500">Copied!</p>
        {:else}
            <p class="mb-4 text-sm italic text-slate-500">Click to copy to clipboard</p>
        {/if}
        
        <table class="border border-slate-950 bg-slate-700">
            {#each files as { name }, i}
                <tr class="border border-slate-950">
                    <td class="px-8">
                        <button on:click={copyLink(name)}>https://files.tabbynet.com/{name}</button>
                    </td>
                </tr>
            {/each}
        </table>
        <button class="px-2 mt-4 mr-auto rounded-lg border border-slate-950 bg-slate-700" on:click={resetPage}>Go back</button>
    {/if}
</div>

<p class="absolute right-4 bottom-4 text-sm italic text-slate-500">guest link</p>

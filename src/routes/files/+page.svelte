<title>tabbynet files - file list</title>

<script>
    // Imports
    import axios from 'axios';

    export let data;                    // data from backend
    const debug = true;                 // Debug flag

    // Function to format file sizes
    // Credit to https://stackoverflow.com/a/42408230
    function shortenBytes(n) {
        const k = n > 0 ? Math.floor((Math.log2(n)/10)) : 0;
        const rank = (k > 0 ? 'KMGT'[k - 1] : '') + 'B';
        const count = Math.floor(n / Math.pow(1024, k));
        return count + rank;
    }

    // Function to call API to delete files
    const deleteFile = async (key) => {
        // Prompt for confirmation
        if(!confirm(`Are you sure you want to delete ${key}?`)) return;

        if (debug) console.log(`Deleting file ${key}`);

        // Send deletion request
        const response = await axios.delete(
            '/api/delete',
            {
                headers: {
                    'Authorization': data.token,
                    'X-File-Name': key
                },
            }
        );

        if (debug) console.log(response);

        // If status !== OK, alert
        if(response.status !== 200) {
            alert("deletion failed");
        }
        else {
            // else, refresh page
            location.reload();
        }
    };

    const copyLink = (event) => {
        // Grab file name from button label
        const oldLabel = event.target.innerText;

        if (debug) console.log(oldLabel);

        // Push link to clipboard and display "Copied!" message
        navigator.clipboard.writeText(`https://files.tabbynet.com/${oldLabel}`);
        event.target.innerText = "Copied!";

        // Reset variable and hide the text after 2 seconds
        setTimeout(() => {event.target.innerText = oldLabel;}, 2000);
    };
</script>

<div class="flex flex-col m-auto text-center">
    {#if data.files.length > 0}
        <table class="border border-slate-950 bg-slate-700">
            <tr class="font-semibold border bg-slate-600 border-slate-950">
                <th class="px-8">Name</th>
                <th class="px-8">Size</th>
                <th class="px-8">Expiry</th>
                <th class="px-8">Uploader IP</th>
                <th class="px-8">Guest upload</th>
                <th></th>
                <th></th>
            </tr>
            {#each data.files as { key, size, expiry, guest, ip }, i}
                <tr class="border border-slate-950">
                    <td class="px-8">
                        <button on:click={copyLink}>{key}</button>
                    </td>
                    <td class="px-8">
                        <p>{shortenBytes(size)}</p>
                    </td>
                    <td class="px-8">
                        <p>{expiry}</p>
                    </td>
                    <td class="px-8">
                        {ip}
                    </td>
                    <td class="px-8">
                        {guest}
                    </td>
                    <td class="px-8 bg-red-800">
                        <button on:click={deleteFile(key)}>Delete</button>
                    </td>
                </tr>
            {/each}
        </table>
        <p class="ml-auto text-sm italic text-slate-500">hint: click on a file name to copy a link to it!</p>
    {:else}
        <p class="mb-4 text-sm italic text-slate-500">There are no files. Upload something!</p>
    {/if}
</div>
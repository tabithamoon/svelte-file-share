<title>tabbynet files - file list</title>

<script>
    // Imports
    import axios from 'axios';

    export let data;                    // data from backend

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
        console.log(`Deleting file ${key}`);

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

        // If status !== OK, alert
        if(response.status !== 200) {
            alert("deletion failed");
        }
        else {
            // else, refresh page
            location.reload();
        }
    }
</script>

<div class="flex flex-col m-auto text-center">
    {#if data.files.length > 0}
        <table class="border border-slate-950 bg-slate-700">
            {#each data.files as { key, size, expiry, guest, ip }, i}
                <tr class="border border-slate-950">
                    <td class="px-8">
                        <p>{key}</p>
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
    {:else}
        <p class="mb-4 text-sm italic text-slate-500">There are no files. Upload something!</p>
    {/if}
</div>
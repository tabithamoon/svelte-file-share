<title>tabbynet files - guest links</title>

<script>
    // Imports
    import Header from '../../components/Header.svelte';
    import axios from 'axios';

    export let data;        // data from backend
    const debug = true;     // debug flag

    if (debug) console.log(data);

    // Function to redirect to create guest link
    function goToCreateLink() {
        location.href = '/guest/create';
    }

    async function deleteLink(key) {
        // Prompt for confirmation
        if(!confirm(`Are you sure you want to delete ${key}?`)) return;

        if (debug) console.log(`Deleting link ${key}`);

        // Send deletion request
        const response = await axios.delete(
            '/api/guest',
            {
                headers: {
                    'Authorization': data.token,
                    'X-Key-Id': key
                }
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
    }

    const copyLink = (event) => {
        // Grab file name from button label
        const oldLabel = event.target.innerText;

        if (debug) console.log(oldLabel);

        // Push link to clipboard and display "Copied!" message
        navigator.clipboard.writeText(`https://share.tabbynet.com/guest/${oldLabel}`);
        event.target.innerText = "Copied!";

        // Reset variable and hide the text after 2 seconds
        setTimeout(() => {event.target.innerText = oldLabel;}, 2000);
    };
</script>

<Header />

<div class="flex flex-col m-auto text-center">
    {#if data.links.length > 0}
        <table class="border border-slate-950 bg-slate-700">
            <tr class="font-semibold border bg-slate-600 border-slate-950">
                <th class="px-8">Link ID</th>
                <th class="px-8">Comment</th>
                <th class="px-8">Expiry date</th>
                <th class="px-8">Remaining uses</th>
                <th></th>
            </tr>
            {#each data.links as { key, comment, uploads, expiry }}
                <tr class="border border-slate-950">
                    <td class="px-8">
                        <button on:click={copyLink}>{key}</button>
                    </td>
                    <td class="px-8">
                        {comment}
                    </td>
                    <td class="px-8">
                        {new Date(expiry * 1000).toLocaleString()}
                    </td>
                    <td class="px-8">
                        {uploads}
                    </td>
                    <td class="px-8 bg-red-800">
                        <button on:click={deleteLink(key)}>Delete</button>
                    </td>
                </tr>
            {/each}
        </table>
        <p class="ml-auto text-sm italic text-slate-500">hint: click on a file name to copy a link to it!</p>
    {:else}
    <p class="italic text-slate-500">There are no guest links. Go create some!</p>
    {/if}

    <button class="px-2 mt-2 ml-auto rounded-lg border border-slate-950 bg-slate-700" on:click={goToCreateLink}>Create a link</button>
</div>
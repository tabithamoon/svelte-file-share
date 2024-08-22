<title>tabbynet files - create guest link</title>

<script>
    import Header from '../../../components/Header.svelte';
	import axios from 'axios';
    const debug = true; // Debug flag

    // Create variables to hold data
    let comment, expiryDate, maxUploads, generatedLink;

    // Return data from backend
    export let data;

    // Function to generate link
    const createLink = async () => {
        // Get expiry timestamp
        // Divide by 1000 as backend takes seconds, not ms
        const expiry = (new Date().getTime() + (86400000 * expiryDate)) / 1000;
        
        if (debug) console.log(expiry);

        // Sanitize input
        maxUploads = maxUploads.replace(/[^0-9]/g, '');

        // If after sanitization max uploads is not a number, bail
        if (maxUploads === "" || isNaN(maxUploads)) {
            alert("Max upload count is invalid.");
            return;
        }

        // Create object holding all of our details
        const command = {
            comment: comment,
            uploads: maxUploads,
            expiry: expiry 
        };

        if (debug) console.log(command);

        // Make request to backend
        const response = await axios.put(
            '/api/guest',
            command,
            {
                headers: {
                    Authorization: data.token,
                    "X-Link-Expiry": (expiry)
                }
            }
        );

        if (debug) console.log(response);

        // If response is not Created, fail out
        if (response.status !== 201) {
            alert("Failed to create guest link");
            return;
        }

        // Set generated link
        generatedLink = `https://share.tabbynet.com/guest/${response.data}`;
    }

    // Function to copy link to clipboard
    const copyLink = () => {
        // Store link temporarily
        const oldLink = generatedLink;
        
        // Push link to clipboard and display "Copied!" message
        navigator.clipboard.writeText(oldLink);
        generatedLink = "Copied!";

        // Set back to link after 2 seconds
        setTimeout(() => {generatedLink = oldLink;}, 2000);
    }
</script>

<Header />

<div class="flex flex-col m-auto text-center">
    {#if !generatedLink}
        <p class="mb-4 text-xl">Create a guest link</p>

        <p class="text-sm italic text-slate-500">Comment</p>
        <input class="px-2 w-60 rounded-lg border border-slate-950 bg-slate-700" bind:value={comment} placeholder="Comment"/>

        <p class="mt-2 text-sm italic text-slate-500">Max uploads</p>
        <input class="px-2 w-60 rounded-lg border border-slate-950 bg-slate-700" bind:value={maxUploads}>

        <p class="mt-2 text-sm italic text-slate-500">Expiry time</p>
        <select class="px-2 w-60 rounded-lg border border-slate-950 bg-slate-700" bind:value={expiryDate}>
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
        </select>

        <button class="mt-4 w-60 rounded-lg border border-slate-950 bg-slate-700" on:click={createLink}>Create guest link</button>
    {:else}
        <p class="mb-4 text-xl">Link generated!</p>
        <button on:click={copyLink}>{generatedLink}</button>
        <p class="text-sm italic text-slate-500">hint: click the link to copy it to your clipboard!</p>
    {/if}
</div>
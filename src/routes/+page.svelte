<script>
    export let form;
</script>

<title>tabbynet files - login</title>
<form class="flex flex-col m-auto text-center" method="post" id="form" action="/upload" enctype="multipart/form-data">
    <label for="secret" class="mb-4 text-3xl">Log in</label>
    <input class="px-2 w-60 rounded-lg border border-slate-950 bg-slate-700" type="password" id="secret" name="secret" placeholder="Secret"/>
    <input type="submit" hidden />
    {#if form !== null}
        <p class="text-sm italic text-red-600">{form.message}</p>
    {/if}
</form>
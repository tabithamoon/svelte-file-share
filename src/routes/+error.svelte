<script>
    import { page } from '$app/stores';
</script>

<div class="flex flex-col m-auto text-center">
    <div class="flex">
        <p class="text-3xl italic">{$page.status}</p>
        <p class="mt-auto ml-2 text-lg italic text-slate-600">{$page.error.message}</p>
    </div>
    <a href="/">return to safety</a>
</div>
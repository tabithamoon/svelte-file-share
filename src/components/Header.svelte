<script>
    const logout = () => {
        window.location.href = "/?logout=true";
    }
</script>

<div class="fixed top-0 z-50 w-screen h-16 drop-shadow-xl bg-slate-700">
    <div class="flex h-full text-lg">
        <div class="my-auto ml-8 lg:ml-32">
            <a href="/upload">Upload</a>
        </div>
        <div class="my-auto ml-8">
            <a href="/files">Files</a>
        </div>
        <div class="my-auto ml-8">
            <a href="/guest">Guest links</a>
        </div>
        <div class="my-auto mr-8 ml-auto lg:mr-32">
            <button on:click={logout}>Log out</button>
        </div>
    </div>
</div>
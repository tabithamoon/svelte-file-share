<script>
    export let data;
    let files;

    const uploadFiles = async () => {
        const token = data.token

        for (const file of files) {
            console.log(file);
            if (file.size > 100663296) { // 96MB chunk size
                console.log("chunked upload");
                alert("not implemented");
            }
            else {
                console.log("direct upload");

                const headers = new Headers();
                headers.append("Authorization", token);
                headers.append("X-File-Name", "1d/" + file.name);
                headers.append("X-Upload-Action", "direct");

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
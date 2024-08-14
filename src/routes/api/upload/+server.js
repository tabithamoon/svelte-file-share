import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    console.log(request.headers)
    return json({ error: false })
}
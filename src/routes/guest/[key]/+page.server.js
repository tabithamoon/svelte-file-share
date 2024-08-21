export async function load({ platform, params }) {
    // Get Cloudflare bindings
    const kv = platform.env.GUEST_KEYS;

    // Get user's guest key
    const key = params.key;

    // Try to get guest details
    let guest = kv.get(key);

    // Kick them out if the key is invalid
    if (guest == null) {
        return {
            error: true,
            message: "Guest key is invalid."
        };
    }

    // Parse key JSON
    guest = JSON.parse(guest);

    // Return guest data
    return guest.map(x => ({
        maxUploads: x.maxUploads,
        expiry: x.expiry,        
    }));
}
const express = require('ultimate-express');
const app = express();
const ejs = require('ejs');
const fetch = require('undici').fetch;
const port = 3000;
app.set('view engine', 'ejs')

const headers = {
    'accept': '*/*',
    'accept-language': 'tr-TR,tr;q=0.9',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://www.instagram.com/ichisansfw/',
    'sec-ch-prefers-color-scheme': 'dark',
    'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    'sec-ch-ua-full-version-list': '"Google Chrome";v="137.0.7151.120", "Chromium";v="137.0.7151.120", "Not/A)Brand";v="24.0.0.0"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-model': '"Nexus 5"',
    'sec-ch-ua-platform': '"Android"',
    'sec-ch-ua-platform-version': '"6.0"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
    'x-asbd-id': '359341',
    'x-csrftoken': 'ipOmG_DLfBevYqVERlbQ1d',
    'x-ig-app-id': '936619743392459',
    'x-ig-www-claim': '0',
    'x-requested-with': 'XMLHttpRequest',
    'x-web-device-id': 'D44AFF13-2435-4584-9DDD-5DB75B20BDD2',
    'x-web-session-id': 'sidgh9:agcn37:xaiprc',
    'cookie': 'csrftoken=ipOmG_DLfBevYqVERlbQ1d; datr=tRJbaKMXIBVuZpT3p9opHEOI; ig_did=D44AFF13-2435-4584-9DDD-5DB75B20BDD2'
};

app.get('/', (req, res) => {
    if (req.query.username) {
        return res.redirect(`/${req.query.username}`);
    }
    res.render('home.ejs');
});

app.get('/api/pfp/:username', async (req, res) => {
    const username = req.params.username;
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: headers,
            body: null
        });

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 100)}`);
        }

        const info = await response.json();
        const profilePicUrl = info.data.user.profile_pic_url_hd || info.data.user.profile_pic_url;

        const imageResponse = await fetch(profilePicUrl, {
            method: "GET",
            headers: headers
        });

        if (!imageResponse.ok) {
            return res.status(404).send('Image not found');
        }

        const imageContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', imageContentType);

        const imageBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        res.send(buffer);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Something went wrong!');
    }
});

app.get('/api/pfp/highres/:username', async (req, res) => {
    const username = req.params.username;
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: headers,
            credentials: "include"
        });

        if (!response.ok) {
            return res.status(response.status).send('User not found or API error');
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 100)}`);
        }

        const info = await response.json();

        if (!info.data || !info.data.user) {
            return res.status(404).send('User data not found');
        }

        const profilePicUrl = info.data.user.profile_pic_url_hd || info.data.user.profile_pic_url;

        if (!profilePicUrl) {
            return res.status(404).send('Profile picture URL not found');
        }

        const imageResponse = await fetch(profilePicUrl, {
            method: "GET",
            headers: headers
        });

        if (!imageResponse.ok) {
            console.error(`Image fetch failed: ${imageResponse.status} ${imageResponse.statusText}`);
            return res.status(404).send('Image not found');
        }

        const imageContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', imageContentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const imageBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        res.send(buffer);

    } catch (error) {
        console.error("Error fetching profile picture:", error);
        res.status(500).send('Something went wrong!');
    }
});

app.get('/api/image', async (req, res) => {
    const imageUrl = req.query.url;

    if (!imageUrl) {
        return res.status(400).send('Image URL is required');
    }

    try {
        const response = await fetch(imageUrl, {
            method: "GET",
            headers: {
                ...headers,
                'referer': 'https://www.instagram.com/',
                'sec-fetch-site': 'same-origin'
            }
        });

        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch image');
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');

        const imageBuffer = await response.arrayBuffer();
        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        console.error("Image proxy error:", error);
        res.status(500).send('Error fetching image');
    }
});

// Fixed pagination endpoint using GraphQL
app.get('/api/:username/posts', async (req, res) => {
    const username = req.params.username;
    const after = req.query.after; // cursor for pagination

    try {
        // First get user ID from username
        const profileUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
        const profileResponse = await fetch(profileUrl, {
            method: "GET",
            headers: headers,
            credentials: "include"
        });

        if (!profileResponse.ok) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profileData = await profileResponse.json();
        const userId = profileData.data.user.id;

        // Build GraphQL query variables
        const variables = {
            id: userId,
            first: 12
        };

        if (after) {
            variables.after = after;
        }

        // Use GraphQL endpoint for pagination
        const graphqlUrl = `https://www.instagram.com/graphql/query/?doc_id=7950326061742207&variables=${encodeURIComponent(JSON.stringify(variables))}`;

        const response = await fetch(graphqlUrl, {
            method: "GET",
            headers: headers,
            credentials: "include"
        })

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch posts' });
        }

        const contentType = response.headers.get('content-type') || '';
        console.log(contentType)
        if (!contentType.includes('application/json')) {
            return res.status(500).json({ error: 'Invalid response format' });
        }

        const data = await response.json();

        if (!data.data || !data.data.user || !data.data.user.edge_owner_to_timeline_media) {
            return res.json({ posts: [], hasMore: false, nextCursor: null });
        }

        const mediaData = data.data.user.edge_owner_to_timeline_media;
        const posts = mediaData.edges.map(edge => ({
            id: edge.node.id,
            display_url: edge.node.display_url,
            is_video: edge.node.is_video || false,
            video_url: edge.node.video_url || null,
            thumbnail_url: edge.node.thumbnail_src || edge.node.display_url
        }));

        res.json({
            posts: posts,
            hasMore: mediaData.page_info.has_next_page,
            nextCursor: mediaData.page_info.end_cursor
        });

    } catch (error) {
        console.error("Error loading posts:", error);
        res.status(500).json({ error: 'Failed to load posts' });
    }
});

app.get('/:username', async (req, res) => {
    const username = req.params.username;

    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: headers,
            credentials: "include",
        });

        // Add the responseText variable here
        const responseText = await response.text();

        const contentType = response.headers.get('content-type') || '';
        console.log("Content-Type:", contentType);

        if (!contentType.includes('application/json')) {
            throw new Error(`Expected JSON but got ${contentType}: ${responseText.substring(0, 100)}`);
        }

        const info = JSON.parse(responseText);

        console.log(info);

        const enhancedPosts = info.data.user.edge_owner_to_timeline_media.edges.map(edge => ({
            ...edge,
            node: {
                ...edge.node,
                is_video: edge.node.is_video || false,
                video_url: edge.node.video_url || null
            }
        }));

        const userData = {
            ...info.data.user,
            edge_owner_to_timeline_media: {
                ...info.data.user.edge_owner_to_timeline_media,
                edges: enhancedPosts
            }
        };

        res.render('profile.ejs', {
            user: userData,
            info: info
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send('Something went wrong!');
    }
});

app.get('/favicon.ico', async (req, res) => {
    res.sendFile('favicon.ico')
})

app.listen(port, () => {
    const colors = {
        reset: '\x1b[0m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m'
    };

    console.log(`${colors.cyan}
╔═══════════════════════════════════════╗
║                  0GRAM                ║
╚═══════════════════════════════════════╝${colors.reset}

running on port: ${port}`);
});
const express = require('ultimate-express');
const app = express();
const ejs = require('ejs');
const fetch = require('undici').fetch;
const port = 3000;
app.set('view engine', 'ejs')

const headers = {
    'accept': '*/*',
    'accept-language': 'en-EN,en;q=0.9',
    'cache-control': 'no-cache',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://www.instagram.com/',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'sec-ch-prefers-color-scheme': 'dark',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'x-asbd-id': '359341',
    'x-csrftoken': 'il6pGNJLEGdk530QVw0aOa',
    'x-ig-app-id': '936619743392459',
    'x-ig-www-claim': '0',
    'x-requested-with': 'XMLHttpRequest',
    'x-web-device-id': 'BC826045-5B1C-42AB-844C-75EC18F994B9',
    'x-web-session-id': '6p2fr5:e9pqib:azmcve',
    'cookie': 'csrftoken=il6pGNJLEGdk530QVw0aOa; datr=ucdZaMMBAyu8mLjEuKSFHus5; ig_did=BC826045-5B1C-42AB-844C-75EC18F994B9; ps_l=1; ps_n=1; ig_nrcb=1; wd=912x1368; dpr=2.0000000298023224; mid=aFnHvgALAAGK3J3gqfodr1vJ_bBM'
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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
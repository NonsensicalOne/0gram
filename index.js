const express = require('ultimate-express');
const app = express();
const ejs = require('ejs');
const fetch = require('undici').fetch;
const port = 3000;
app.set('view engine', 'ejs')

const headers = require('./.headers.js');

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
    const url = `https://www.instagram.com/graphql/query`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            credentials: "include",
            body: `av=17841475430069406&__d=www&__user=0&__a=1&__req=8&__hs=20264.HYP%3Ainstagram_web_pkg.2.1...0&dpr=3&__ccg=GOOD&__rev=1024172561&__s=phc6cx%3Amtif09%3Aw6foa6&__hsi=7519818450704458413&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o1g8hw2nVE4W0qa0FE2awgo9oO0n24oaEnxO1ywOwv89k2C1Fwc60D87u3ifK0EUjwGzEaE2iwNwmE2eUlwhEe87q0oa2-azo7u3vwDwHg2ZwrUdUbGwmk0zU8oC1Iwqo5p0OwUQp1yUb8jxKi2K7E5y4UrwHwcObyohw4rxO2Cq2K&__csr=gD1l7_58dN2f2a6lLFeZGChQAGFvVcZRFKiXF5AFi5Ay8zp-Gp6FpkmV9e4qF4BGuAFdxh6CiKpGQvG_heWx7mBXJ7RKh2AXjx6iQ9UKeAJGbACVEZfGCU8HgS2it7xKKp2aLzVuuUiGjyWy8NK4GBhlCKAiECayVK5em49Xy8KvxW36eCxh28S00l5O1jxm0cUxe5t0du3G1pixa1SwN7d9o9m0EE2C80kW0H625em0cfw1nK0pO2Vaut0IwbJ0hU12E6-u5y0cy0_64A2B5wEPDwee1Gw4y8i8xh0r65nh82Ywq83yw3t401MYw0zNw1M-&__hsdp=l0MMQO59srdb5hklekXIb1jRGbIAmcinAy85ep8i5ohZy6Gm29QkN6rc8P5o71huUmAwsSbKi1oUOi7UEzxi2e9xe4qyp8lwQwQCgx0Ke9wvEO5E3owhU8EcEtyUnKUjxi1bCwhU0ym4E18U1Po2jwCwMw826o3cyU2IwvE2BwXwcAwtx2q782ew-wnE8E5uEqwWAsw2_xS0yU62&__hblp=0lUdU6q2d0dKaz83cwFwqGzEnBwYxa2y8yVodUG4XGal29axa4E8o9UthocFokzUO1cz8mwHU2ywj-222S4ueG8xuu4UGFEa88FE4u1awWwKAwd60CoiCJ0h87O1lzE1lo6y2i1pxi7oy2yu0w8pxSU5uewgUK0H8swoo2BwXwcAwtx2q7e487K3W1uguG322qE_Aw-Asw884u7ob8yEtw8F0AyEc8&__comet_req=7&fb_dtsg=NAftK0LssKo4TD7ECjYgCLJ--92h5H8FwxDbNS5lglOLtwX9l4JO8qg%3A17865145036029998%3A1750843419&jazoest=26033&lsd=KAx5LvmccjkRbvnrGwtruA&__spin_r=1024172561&__spin_b=trunk&__spin_t=1750844170&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsQuery&variables=%7B%22data%22%3A%7B%22count%22%3A12%2C%22include_reel_media_seen_timestamp%22%3Atrue%2C%22include_relationship_info%22%3Atrue%2C%22latest_besties_reel_media%22%3Atrue%2C%22latest_reel_media%22%3Atrue%7D%2C%22username%22%3A%22${username}%22%2C%22__relay_internal__pv__PolarisIsLoggedInrelayprovider%22%3Atrue%2C%22__relay_internal__pv__PolarisShareSheetV3relayprovider%22%3Atrue%7D&server_timestamps=true&doc_id=23905326119127169`
        });

        const responseText = await response.text();
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error(`Expected JSON but got ${contentType}: ${responseText.substring(0, 100)}`);
        }
        const info = JSON.parse(responseText);

        const timelineData = info.data.xdt_api__v1__feed__user_timeline_graphql_connection;
        if (!timelineData || !timelineData.edges) {
            return res.render('profile.ejs', {
                user: { edge_owner_to_timeline_media: { count: 0, edges: [] } },
                info: {}
            });
        }

        const enhancedPosts = timelineData.edges.map(edge => ({
            ...edge,
            node: {
                ...edge.node,
                is_video: edge.node.video_versions !== null && edge.node.video_versions !== undefined,
                video_url: edge.node.video_versions && edge.node.video_versions.length > 0 ?
                    edge.node.video_versions[0].url :
                    null,
                image_url: edge.node.image_versions2 && edge.node.image_versions2.candidates && edge.node.image_versions2.candidates.length > 0 ?
                    edge.node.image_versions2.candidates[0].url :
                    null,
                media_type: edge.node.video_versions !== null && edge.node.video_versions !== undefined ? 'video' : 'image'
            }
        }));

        const profileResponse = await fetch("https://www.instagram.com/graphql/query", {
            method: "POST",
            headers: headers,
            body: `av=17841475430069406&__d=www&__user=0&__a=1&__req=4&__hs=20264.HYP%3Ainstagram_web_pkg.2.1...0&dpr=3&__ccg=GOOD&__rev=1024174358&__s=wc92gw%3Aijjq08%3Aff1dmr&__hsi=7519844879460866429&__dyn=7xe5WwlEnwn8K2Wmm1twpUnwgU7S6EdF8aUco38w5ux609vCwjE1EE2Cw8G11wBw5Zx62G3i1ywOwv89k2C0iK0D82YK0EUjwGzEaE2iwNwmE2exu16wUw7VwLyES1TwTwFwIwbS1LwTwKG1pg2Xwr86C1mg6LhA6bwg8rAwHxW1oxe6UaU3cyUrw4rxO2Cq2K&__csr=n3A6dNAAj6iPhYWn9iQCy-imGvGAJA-TTeHGVvBGW9CWF3p-ZBZ9pF9O4xd2pap4by-HKq-iGgDLAioyqWlbVFJ6AVkLy9uip7AG4GAWU-BVUKmFot_jGqVESUvhE-JbAxKdUKQuEy54nCxqfGvVKiqFVel7yoLQ9UgAye8Gu694eG223mcyEjDg01jXk1Ew3DCEiwfa3O1nG4A1SwM4Pplwza0GE2rwYwad0sE2ACgmzbAw2Z80mdw6swSihFUbE2Xg4u0gG1SUl80Oo3Xoigakm2uzpE1jo18yz8kg6ul3ExkU2Ywq40Uo07X602eC075E&__hsdp=l0NMLExiNdsh24A8jBbiIb1iBhFFi8mh5hBy8fEuhV10WfCqmGqx-Ah4dJ6esF4C1JIkhUiBwi8d7xm3i68qgoxEzxW48_wAmbK1mwg44odPzofUO3C3h1S5oih8aE6u1nxy1vx2E1Fo16E3cw24Eb84K0ku1DxS1-G3W6U2sw9m0TojwaiS2-6-1RwtU2ywBwrErzPpA0U8nwaau17w&__hblp=0lU4G1txB0d-m583kxq1ByEgwjGx6m2Wm7rwJy8zxDBFoK-48fF8W1rwQxW7KcGcwFwQgC4UlGfh8aE6G6VEcpEhwsay82qwj86y1bw4qxK5Eeo5-q584-0l-i11wIxFbwGwfS19y8twg8tV87e2m7Urw9O3S1nwdS4U2AJwLxLwmorwiobo7632bxC6UpwEzUrzN1Acz84G12wHz8nw9Oh7zUnx-&__comet_req=7&fb_dtsg=NAfvDYea16_0SbijWFyFDEyLXUfyUYrKtA7a8QP8ld7XM6YebCyLBnQ%3A17865145036029998%3A1750843419&jazoest=26231&lsd=27eySuQCFG_OFp3xawnPn5&__spin_r=1024174358&__spin_b=trunk&__spin_t=1750850323&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePageContentQuery&variables=%7B%22id%22%3A%22${info.data.xdt_api__v1__feed__user_timeline_graphql_connection.edges[0].node.user.pk}%22%2C%22render_surface%22%3A%22PROFILE%22%7D&server_timestamps=true&doc_id=9916454141777118`
        });

        const userResponse = await profileResponse.json();

        const userData = {
            ...userResponse.data.user,
            edge_owner_to_timeline_media: {
                ...timelineData,
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
});

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
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
    'referer': 'https://www.instagram.com/ichisansfw/',
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

        // Check if response is JSON before parsing
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
        // Get user profile info with Instagram API headers
        const response = await fetch(url, {
            method: "GET",
            headers: headers, // Use your Instagram headers here
            credentials: "include"
        });

        if (!response.ok) {
            return res.status(response.status).send('User not found or API error');
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 100)}`);
        }

        const info = await response.json();

        // Check if user data exists
        if (!info.data || !info.data.user) {
            return res.status(404).send('User data not found');
        }

        const profilePicUrl = info.data.user.profile_pic_url_hd || info.data.user.profile_pic_url;

        if (!profilePicUrl) {
            return res.status(404).send('Profile picture URL not found');
        }

        // Fetch image with minimal, clean headers
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

        // Optional: Add cache headers
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        const imageBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        res.send(buffer);

    } catch (error) {
        console.error("Error fetching profile picture:", error);
        res.status(500).send('Something went wrong!');
    }
});

// Image proxy endpoint to bypass Instagram CDN restrictions
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

app.get('/:username', async (req, res) => {
    const username = req.params.username;
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: headers,
            credentials: "include",
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 100)}`);
        }

        const info = await response.json();

        res.render('profile.ejs', {
            user: info.data.user,
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

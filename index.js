const express = require("ultimate-express");
const app = express();
const path = require("path");
const fetch = require("undici").fetch;
const port = 3000;
app.set("view engine", "ejs");

const headers = require("./.headers.js");

app.get("/", (req, res) => {
  if (req.query.username) {
    return res.redirect(`/${req.query.username}`);
  }
  res.render("home.ejs");
});

app.get("/favicon.png", (req, res) => {
  res.set("Content-Type", "image/png");
  res.sendFile(path.join(__dirname, "public", "favicon.png"));
});

app.get("/api/image", async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send("Image URL is required");
  }

  try {
    const response = await fetch(imageUrl, {
      method: "GET",
      headers: {
        ...headers,
        referer: "https://www.instagram.com/",
        "sec-fetch-site": "same-origin",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send("Failed to fetch image");
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    const imageBuffer = await response.arrayBuffer();
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error("Image proxy error:", error);
    res.status(500).send("Error fetching image");
  }
});

fetch("https://www.instagram.com/graphql/query", {
  headers: {
    accept: "*/*",
    "accept-language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded",
    pragma: "no-cache",
    priority: "u=1, i",
    "sec-ch-prefers-color-scheme": "dark",
    "sec-ch-ua":
      '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    "sec-ch-ua-full-version-list":
      '"Google Chrome";v="137.0.7151.120", "Chromium";v="137.0.7151.120", "Not/A)Brand";v="24.0.0.0"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-model": '"Nexus 5"',
    "sec-ch-ua-platform": '"Android"',
    "sec-ch-ua-platform-version": '"6.0"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-asbd-id": "359341",
    "x-bloks-version-id":
      "c13184f24deef94026e34115065a00e40a52a9a1044b0c2a17cc292a764e5598",
    "x-csrftoken": "bbeoUR9kMv6ZFSOXbM8ySUd6oJTFaUQ0",
    "x-fb-friendly-name": "PolarisProfilePostsTabContentQuery_connection",
    "x-fb-lsd": "kb7kWXLtfhpPCKxAoQkcbJ",
    "x-ig-app-id": "936619743392459",
    "x-root-field-name": "xdt_api__v1__feed__user_timeline_graphql_connection",
    cookie:
      'ig_did=BBB48437-E62D-4396-9F6E-E8AF5E9EAA91; datr=zLtZaMO27HS-ZdYhcGQ7wO5b; ps_l=1; ps_n=1; ig_nrcb=1; ds_user_id=75515250335; mid=aFvCjQALAAGMVq5XqLg2lmqxZRSd; csrftoken=bbeoUR9kMv6ZFSOXbM8ySUd6oJTFaUQ0; wd=1198x1384; sessionid=75515250335%3Ay94uM0tt9DxFwU%3A15%3AAYfCEdtHsHNpLVFCBmENo0U_9hmadYEfnJw-_109Rg; dpr=1.25; rur="CLN\\05475515250335\\0541782400598:01fec8d7748568fac6a1e8138eb3f1d9639cecd08a1ec7da175488e7bac8efbbdc4b6496"',
    Referer: "https://www.instagram.com/ichisansfw",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },
  body: "av=17841475430069406&__d=www&__user=0&__a=1&__req=z&__hs=20264.HYP%3Ainstagram_web_pkg.2.1...0&dpr=3&__ccg=GOOD&__rev=1024176170&__s=hw15o2%3A1y992x%3Azeyvho&__hsi=7519906151278841461&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o2vwa24o0B-q1ew6ywaq0yE462mcw5Mx62G5UswoEcE7O2l0Fwqo31w9O1TwQzXwae4UaEW2G0AEco5G1Wxfxm16wUwtE1wEbUGdG1QwTU9UaQ0Lo6-3u2WE5B08-269wr86C1mgcEed6goK2O4Xxui2K7E5y4UrwHwGwa6byohw4rxO2Cq2K&__csr=gNd0wsaNQnd6OjV7lEYsyr9aj5iP4R9HAXOa-Zd5K8FpKHAjHQh9qBSpxejVbVap9pFpfXyGmWQrQaWAmGp9XGunqhazlLgTy4UyFWy8y88V9bzKXnzVXKFu2u6EReUNoKmq48RrGbLXgyQEWKEy9UoVF8x35jHx6Ly8hxp0DCGu2K4UhyWgjw05fOg6y0euqxa0YEf8jwgWx90tEc1cSlo8OwaG0CUf82zg7a0z45FA5EOV80Li05zo1D8dACdwLwbJ0hU12E7pCyHa0O83XoigapEW5X405jw4yc261DCgR25g2_wMwTo3ww3uo14806Oq02eC075E&__hsdp=gfX8lMx9axIl5jL8lcb1agDkNZT75h1uwckt4noSF2heELx9t6cQHe4sQq1vgK5V5wGo5hx26UfEaAfB86Fa85oqyEkAWw9J10g1BgnDU42mcAw4byqxebzHxem-iu1JG0K81cE21w4tw5Xwe-6o24wqEW1TG1axa0Ao7S0M8gwdQweE6K3q6827xy1nwGxoUW0Xoc823x2&__hblp=1615x216wio84U8A0zXy8qFa4Q0LE9GG2y8xi2138G322GimubzovVoiUS6VayVHCzpFeFe4o2kwx-2C78nh-5azEohoOi364E7K9GawOyqxebxa7uK3K78SeG6E4S2S260ja323e78gwzwqE7S0Xo-1OgC1PwuUpwTwZzE8E4uuq4rwioeU9Gxa0Aoswo830x20Ti0LyErwjUaEK6820Cxy6Ed-GwDxoVbAgW7U4F0-wPG2S1Lxe48jw&__comet_req=7&fb_dtsg=NAft0cIuJl80cYDootimyVD7moXmFDMrGGclV0cqSAZ7SSiQqcdqQZA%3A17843691127146670%3A1750856064&jazoest=26396&lsd=kb7kWXLtfhpPCKxAoQkcbJ&__spin_r=1024176170&__spin_b=trunk&__spin_t=1750864589&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsTabContentQuery_connection&variables=%7B%22after%22%3A%223270674051137747654_12117190025%22%2C%22before%22%3Anull%2C%22data%22%3A%7B%22count%22%3A12%2C%22include_reel_media_seen_timestamp%22%3Atrue%2C%22include_relationship_info%22%3Atrue%2C%22latest_besties_reel_media%22%3Atrue%2C%22latest_reel_media%22%3Atrue%7D%2C%22first%22%3A12%2C%22last%22%3Anull%2C%22username%22%3A%22ichisansfw%22%2C%22__relay_internal__pv__PolarisIsLoggedInrelayprovider%22%3Atrue%2C%22__relay_internal__pv__PolarisShareSheetV3relayprovider%22%3Atrue%7D&server_timestamps=true&doc_id=24796768439926139",
  method: "POST",
});

// Fixed pagination endpoint using GraphQL
app.get("/api/:username/posts", async (req, res) => {
  const username = req.params.username;
  const after = req.query.after || "";

  try {
    const profileResponse = await fetch(
      "https://www.instagram.com/graphql/query",
      {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: `av=17841475430069406&__d=www&__user=0&__a=1&__req=z&__hs=20264.HYP%3Ainstagram_web_pkg.2.1...0&dpr=3&__ccg=GOOD&__rev=1024176170&__s=hw15o2%3A1y992x%3Azeyvho&__hsi=7519906151278841461&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o2vwa24o0B-q1ew6ywaq0yE462mcw5Mx62G5UswoEcE7O2l0Fwqo31w9O1TwQzXwae4UaEW2G0AEco5G1Wxfxm16wUwtE1wEbUGdG1QwTU9UaQ0Lo6-3u2WE5B08-269wr86C1mgcEed6goK2O4Xxui2K7E5y4UrwHwGwa6byohw4rxO2Cq2K&__csr=gNd0wsaNQnd6OjV7lEYsyr9aj5iP4R9HAXOa-Zd5K8FpKHAjHQh9qBSpxejVbVap9pFpfXyGmWQrQaWAmGp9XGunqhazlLgTy4UyFWy8y88V9bzKXnzVXKFu2u6EReUNoKmq48RrGbLXgyQEWKEy9UoVF8x35jHx6Ly8hxp0DCGu2K4UhyWgjw05fOg6y0euqxa0YEf8jwgWx90tEc1cSlo8OwaG0CUf82zg7a0z45FA5EOV80Li05zo1D8dACdwLwbJ0hU12E7pCyHa0O83XoigapEW5X405jw4yc261DCgR25g2_wMwTo3ww3uo14806Oq02eC075E&__hsdp=gfX8lMx9axIl5jL8lcb1agDkNZT75h1uwckt4noSF2heELx9t6cQHe4sQq1vgK5V5wGo5hx26UfEaAfB86Fa85oqyEkAWw9J10g1BgnDU42mcAw4byqxebzHxem-iu1JG0K81cE21w4tw5Xwe-6o24wqEW1TG1axa0Ao7S0M8gwdQweE6K3q6827xy1nwGxoUW0Xoc823x2&__hblp=1615x216wio84U8A0zXy8qFa4Q0LE9GG2y8xi2138G322GimubzovVoiUS6VayVHCzpFeFe4o2kwx-2C78nh-5azEohoOi364E7K9GawOyqxebxa7uK3K78SeG6E4S2S260ja323e78gwzwqE7S0Xo-1OgC1PwuUpwTwZzE8E4uuq4rwioeU9Gxa0Aoswo830x20Ti0LyErwjUaEK6820Cxy6Ed-GwDxoVbAgW7U4F0-wPG2S1Lxe48jw&__comet_req=7&fb_dtsg=NAft0cIuJl80cYDootimyVD7moXmFDMrGGclV0cqSAZ7SSiQqcdqQZA%3A17843691127146670%3A1750856064&jazoest=26396&lsd=kb7kWXLtfhpPCKxAoQkcbJ&__spin_r=1024176170&__spin_b=trunk&__spin_t=1750864589&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsTabContentQuery_connection&variables=%7B%22after%22%3A%22${after}%22%2C%22before%22%3Anull%2C%22data%22%3A%7B%22count%22%3A12%2C%22include_reel_media_seen_timestamp%22%3Atrue%2C%22include_relationship_info%22%3Atrue%2C%22latest_besties_reel_media%22%3Atrue%2C%22latest_reel_media%22%3Atrue%7D%2C%22first%22%3A12%2C%22last%22%3Anull%2C%22username%22%3A%22${username}%22%2C%22__relay_internal__pv__PolarisIsLoggedInrelayprovider%22%3Atrue%2C%22__relay_internal__pv__PolarisShareSheetV3relayprovider%22%3Atrue%7D&server_timestamps=true&doc_id=24796768439926139`,
      },
    );

    if (!profileResponse.ok) {
      return res.status(404).json({ error: "User not found" });
    }

    const profileData = await profileResponse.json();
    const timeline =
      profileData?.data?.xdt_api__v1__feed__user_timeline_graphql_connection;

    if (!timeline || !Array.isArray(timeline.edges)) {
      return res.json({ posts: [], hasMore: false, nextCursor: null });
    }

    const posts = timeline.edges.map(({ node }) => {
      const image = node.image_versions2?.candidates?.[0]?.url || null;

      return {
        id: node.id,
        caption: node.caption?.text || "",
        display_url: image,
        is_video: node.media_type === 2 || false,
        video_url: node.video_versions?.[0]?.url || null,
        thumbnail_url: image,
      };
    });

    res.json({
      posts,
      hasMore: timeline.page_info?.has_next_page || false,
      nextCursor: timeline.page_info?.end_cursor || null,
    });
  } catch (error) {
    console.error("Error loading posts:", error);
    res.status(500).json({ error: "Failed to load posts" });
  }
});

app.get("/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const response = await fetch("https://www.instagram.com/graphql/query", {
      method: "POST",
      headers: headers,
      credentials: "include",
      body: `av=17841475430069406&__d=www&__user=0&__a=1&__req=8&__hs=20264.HYP%3Ainstagram_web_pkg.2.1...0&dpr=3&__ccg=GOOD&__rev=1024172561&__s=phc6cx%3Amtif09%3Aw6foa6&__hsi=7519818450704458413&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o1g8hw2nVE4W0qa0FE2awgo9oO0n24oaEnxO1ywOwv89k2C1Fwc60D87u3ifK0EUjwGzEaE2iwNwmE2eUlwhEe87q0oa2-azo7u3vwDwHg2ZwrUdUbGwmk0zU8oC1Iwqo5p0OwUQp1yUb8jxKi2K7E5y4UrwHwcObyohw4rxO2Cq2K&__csr=gD1l7_58dN2f2a6lLFeZGChQAGFvVcZRFKiXF5AFi5Ay8zp-Gp6FpkmV9e4qF4BGuAFdxh6CiKpGQvG_heWx7mBXJ7RKh2AXjx6iQ9UKeAJGbACVEZfGCU8HgS2it7xKKp2aLzVuuUiGjyWy8NK4GBhlCKAiECayVK5em49Xy8KvxW36eCxh28S00l5O1jxm0cUxe5t0du3G1pixa1SwN7d9o9m0EE2C80kW0H625em0cfw1nK0pO2Vaut0IwbJ0hU12E6-u5y0cy0_64A2B5wEPDwee1Gw4y8i8xh0r65nh82Ywq83yw3t401MYw0zNw1M-&__hsdp=l0MMQO59srdb5hklekXIb1jRGbIAmcinAy85ep8i5ohZy6Gm29QkN6rc8P5o71huUmAwsSbKi1oUOi7UEzxi2e9xe4qyp8lwQwQCgx0Ke9wvEO5E3owhU8EcEtyUnKUjxi1bCwhU0ym4E18U1Po2jwCwMw826o3cyU2IwvE2BwXwcAwtx2q782ew-wnE8E5uEqwWAsw2_xS0yU62&__hblp=0lUdU6q2d0dKaz83cwFwqGzEnBwYxa2y8yVodUG4XGal29axa4E8o9UthocFokzUO1cz8mwHU2ywj-222S4ueG8xuu4UGFEa88FE4u1awWwKAwd60CoiCJ0h87O1lzE1lo6y2i1pxi7oy2yu0w8pxSU5uewgUK0H8swoo2BwXwcAwtx2q7e487K3W1uguG322qE_Aw-Asw884u7ob8yEtw8F0AyEc8&__comet_req=7&fb_dtsg=NAftK0LssKo4TD7ECjYgCLJ--92h5H8FwxDbNS5lglOLtwX9l4JO8qg%3A17865145036029998%3A1750843419&jazoest=26033&lsd=KAx5LvmccjkRbvnrGwtruA&__spin_r=1024172561&__spin_b=trunk&__spin_t=1750844170&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsQuery&variables=%7B%22data%22%3A%7B%22count%22%3A12%2C%22include_reel_media_seen_timestamp%22%3Atrue%2C%22include_relationship_info%22%3Atrue%2C%22latest_besties_reel_media%22%3Atrue%2C%22latest_reel_media%22%3Atrue%7D%2C%22username%22%3A%22${username}%22%2C%22__relay_internal__pv__PolarisIsLoggedInrelayprovider%22%3Atrue%2C%22__relay_internal__pv__PolarisShareSheetV3relayprovider%22%3Atrue%7D&server_timestamps=true&doc_id=23905326119127169`,
    });

    const responseText = await response.text();
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        `Expected JSON but got ${contentType}: ${responseText.substring(0, 100)}`,
      );
    }
    const info = JSON.parse(responseText);

    const timelineData =
      info.data.xdt_api__v1__feed__user_timeline_graphql_connection;
    if (!timelineData || !timelineData.edges) {
      return res.render("profile.ejs", {
        user: { edge_owner_to_timeline_media: { count: 0, edges: [] } },
        info: {},
      });
    }

    const enhancedPosts = timelineData.edges.map((edge) => ({
      ...edge,
      node: {
        ...edge.node,
        is_video:
          edge.node.video_versions !== null &&
          edge.node.video_versions !== undefined,
        video_url:
          edge.node.video_versions && edge.node.video_versions.length > 0
            ? edge.node.video_versions[0].url
            : null,
        image_url:
          edge.node.image_versions2 &&
          edge.node.image_versions2.candidates &&
          edge.node.image_versions2.candidates.length > 0
            ? edge.node.image_versions2.candidates[0].url
            : null,
        media_type:
          edge.node.video_versions !== null &&
          edge.node.video_versions !== undefined
            ? "video"
            : "image",
      },
    }));

    const profileResponse = await fetch(
      "https://www.instagram.com/graphql/query",
      {
        method: "POST",
        headers: headers,
        body: `av=17841475430069406&__d=www&__user=0&__a=1&__req=4&__hs=20264.HYP%3Ainstagram_web_pkg.2.1...0&dpr=3&__ccg=GOOD&__rev=1024174358&__s=wc92gw%3Aijjq08%3Aff1dmr&__hsi=7519844879460866429&__dyn=7xe5WwlEnwn8K2Wmm1twpUnwgU7S6EdF8aUco38w5ux609vCwjE1EE2Cw8G11wBw5Zx62G3i1ywOwv89k2C0iK0D82YK0EUjwGzEaE2iwNwmE2exu16wUw7VwLyES1TwTwFwIwbS1LwTwKG1pg2Xwr86C1mg6LhA6bwg8rAwHxW1oxe6UaU3cyUrw4rxO2Cq2K&__csr=n3A6dNAAj6iPhYWn9iQCy-imGvGAJA-TTeHGVvBGW9CWF3p-ZBZ9pF9O4xd2pap4by-HKq-iGgDLAioyqWlbVFJ6AVkLy9uip7AG4GAWU-BVUKmFot_jGqVESUvhE-JbAxKdUKQuEy54nCxqfGvVKiqFVel7yoLQ9UgAye8Gu694eG223mcyEjDg01jXk1Ew3DCEiwfa3O1nG4A1SwM4Pplwza0GE2rwYwad0sE2ACgmzbAw2Z80mdw6swSihFUbE2Xg4u0gG1SUl80Oo3Xoigakm2uzpE1jo18yz8kg6ul3ExkU2Ywq40Uo07X602eC075E&__hsdp=l0NMLExiNdsh24A8jBbiIb1iBhFFi8mh5hBy8fEuhV10WfCqmGqx-Ah4dJ6esF4C1JIkhUiBwi8d7xm3i68qgoxEzxW48_wAmbK1mwg44odPzofUO3C3h1S5oih8aE6u1nxy1vx2E1Fo16E3cw24Eb84K0ku1DxS1-G3W6U2sw9m0TojwaiS2-6-1RwtU2ywBwrErzPpA0U8nwaau17w&__hblp=0lU4G1txB0d-m583kxq1ByEgwjGx6m2Wm7rwJy8zxDBFoK-48fF8W1rwQxW7KcGcwFwQgC4UlGfh8aE6G6VEcpEhwsay82qwj86y1bw4qxK5Eeo5-q584-0l-i11wIxFbwGwfS19y8twg8tV87e2m7Urw9O3S1nwdS4U2AJwLxLwmorwiobo7632bxC6UpwEzUrzN1Acz84G12wHz8nw9Oh7zUnx-&__comet_req=7&fb_dtsg=NAfvDYea16_0SbijWFyFDEyLXUfyUYrKtA7a8QP8ld7XM6YebCyLBnQ%3A17865145036029998%3A1750843419&jazoest=26231&lsd=27eySuQCFG_OFp3xawnPn5&__spin_r=1024174358&__spin_b=trunk&__spin_t=1750850323&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePageContentQuery&variables=%7B%22id%22%3A%22${info.data.xdt_api__v1__feed__user_timeline_graphql_connection.edges[0].node.user.pk}%22%2C%22render_surface%22%3A%22PROFILE%22%7D&server_timestamps=true&doc_id=9916454141777118`,
      },
    );

    const userResponse = await profileResponse.json();

    const userData = {
      ...userResponse.data.user,
      edge_owner_to_timeline_media: {
        ...timelineData,
        edges: enhancedPosts,
      },
    };

    res.render("profile.ejs", {
      user: userData,
      info: info,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Something went wrong!");
  }
});

app.listen(port, () => {
  const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  };

  console.log(`${colors.cyan}
╔═══════════════════════════════════════╗
║                  0GRAM                ║
╚═══════════════════════════════════════╝${colors.reset}

running on port: ${port}`);
});

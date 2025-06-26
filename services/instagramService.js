const fetch = require("undici").fetch;
const headers = require("../config/headers");

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
    credentials: "include",
  });
  if (!res.ok)
    throw Object.assign(new Error(`Fetch failed: ${res.status}`), {
      status: res.status,
    });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 100)}`);
  }
}

// Proxy image fetch
async function fetchImage(url) {
  if (!url)
    throw Object.assign(new Error("Image URL required"), { status: 400 });
  const res = await fetch(url, {
    method: "GET",
    headers: { ...headers, referer: "https://www.instagram.com/" },
  });
  if (!res.ok)
    throw Object.assign(new Error(`Failed to fetch image: ${res.status}`), {
      status: res.status,
    });
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const array = await res.arrayBuffer();
  return { contentType, data: Buffer.from(array) };
}

// Fetch a user's posts with pagination
async function fetchPosts(username, after = "") {
  const variables = encodeURIComponent(
    JSON.stringify({ after, first: 12, username }),
  );
  const body = `variables=${variables}&dpr=3`;
  const json = await postJSON(
    "https://www.instagram.com/graphql/query?doc_id=24796768439926139",
    body,
  );

  const timeline = json.data?.user?.edge_owner_to_timeline_media;
  if (!timeline) return { posts: [], hasMore: false, nextCursor: null };

  const posts = timeline.edges.map(({ node }) => ({
    id: node.id,
    caption: node.edge_media_to_caption?.edges[0]?.node.text || "",
    display_url: node.display_url,
    is_video: node.is_video,
    video_url: node.video_url || null,
    thumbnail_url: node.thumbnail_src || node.display_url,
  }));

  return {
    posts,
    hasMore: timeline.page_info.has_next_page,
    nextCursor: timeline.page_info.end_cursor,
  };
}

// Fetch full profile data
async function fetchProfile(username) {
  // 1) Timeline + possible userID
  const initial = await postJSON(
    "https://www.instagram.com/graphql/query?doc_id=24796768439926139",
    `variables=${encodeURIComponent(JSON.stringify({ first: 12, after: "", username }))}&dpr=3`,
  );
  let timeline = initial.data?.user?.edge_owner_to_timeline_media;
  let userId = initial.data?.user?.id;

  // 2) Fallback: search endpoint
  if (!userId) {
    const search = await fetch(
      `https://www.instagram.com/web/search/topsearch/?query=${username}`,
      { headers, credentials: "include" },
    );
    const sjson = await search.json();
    const found = sjson.users.find((u) => u.user.username === username);
    userId = found?.user?.pk;
  }

  // 3) Fallback: HTML scraping
  if (!userId) {
    const page = await fetch(`https://www.instagram.com/${username}`, {
      headers,
    });
    const html = await page.text();
    const m = html.match(/"id":"(\d+)"/);
    userId = m?.[1];
  }

  if (!userId)
    throw Object.assign(new Error("User not found"), { status: 404 });

  // Enhance timeline posts
  const enhanced = (timeline?.edges || []).map((edge) => ({
    ...edge,
    node: {
      ...edge.node,
      is_video: edge.node.is_video,
      video_url: edge.node.video_url || null,
      image_url: edge.node.display_url,
      media_type: edge.node.is_video ? "video" : "image",
    },
  }));

  // 4) Fetch user info
  const profileData = await postJSON(
    "https://www.instagram.com/graphql/query?doc_id=9916454141777118",
    `variables=${encodeURIComponent(JSON.stringify({ id: userId, render_surface: "PROFILE" }))}&dpr=3`,
  );

  const user = profileData.data.user;
  user.edge_owner_to_timeline_media = { ...timeline, edges: enhanced };
  return user;
}

module.exports = { fetchImage, fetchPosts, fetchProfile };

const fetch = require("undici").fetch;
let headers = require("../config/headers");
let lsd;
let csrf;

function setLsdHeader(lsd) {
  headers = { ...headers, "x-fb-lsd": lsd };
}

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
  if (!url) {
    throw Object.assign(new Error("Image URL required"), { status: 400 });
  }

  // Validate allowed domains using a simple, efficient approach
  const allowedHosts = ["fbcdn.net", "cdninstagram.com"];
  try {
    const { hostname } = new URL(url);
    const isAllowed = allowedHosts.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );

    if (!isAllowed) {
      console.log(url);
      throw new Error(
        "Image URL must be from fbcdn.net or cdninstagram.com or their subdomains",
      );
    }
  } catch (err) {
    throw Object.assign(new Error(err), { status: 400 });
  }

  const res = await fetch(url, {
    method: "GET",
    headers: { referer: "https://www.instagram.com/" },
  });

  if (!res.ok) {
    throw Object.assign(new Error(`Failed to fetch image: ${res.status}`), {
      status: res.status,
    });
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const array = await res.arrayBuffer();
  return { contentType, data: Buffer.from(array) };
}

// Fetch a user's posts with pagination
async function fetchPosts(username, after = "") {
  setLsdHeader(headers["x-fb-lsd"]);

  const paginationRes = await fetch("https://www.instagram.com/graphql/query", {
    headers: headers,
    body: `av=17841475430069406&__d=www&__user=0&__a=1&__req=z&__hs=20266.HYP%3Ainstagram_web_pkg.2.1...0&dpr=3&__ccg=GOOD&__rev=1024253163&__s=fl2av0%3Areu7c1%3An9h5ma&__hsi=7520492133797078565&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o1g8hw2nVE4W0qa0FE2awgo9oO0n24oaEnxO1ywOwv89k2C1Fwc60D87u3ifK0EUjwGzEaE2iwNwmE2eUlwhEe87q0oa2-azo7u3vwDwHg2ZwrUdUbGwmk0zU8oC1Iwqo5p0OwUQp1yUb8jxKi2qi7E5y4UrwHwGwa6byohw4rxO2Cq2K&__csr=gmMoEp6RsGYj2cRYGsAJbpa8xfEh95uDFkj-Th_h-SEy-iAi-Hpp8NbyfqZWVlAh2B-l35prpVHTUyCiF4h4gzXBC-GVKvh6ny-9AhXCC-m9wxyUGnxbQ2quQqqvy8WuvXhFbgF5G4oHQ9AyqiBwSgO8GiFerh98-9Dm8wIxZeaLyFoyUG5p8pGueCyokyZ005oeCl04VO04Bo1heexq3-OQu1kCzxcw0E6vx-US220Ao5nodU0C20i204ME0EW3i48aZwiQ1Iw5fIHy4cg7G7EG19xe5o9Ux0qUx2Wc0maE1LO4y45oaEa8922k8g31xeaA874E8y01UC4ajwlEZw0rEE0V6094w0Elw&__hsdp=gfX8kr5Olklk9PJKDEc1qaGRdOmIPbt3o5kl6l4mbrSjiEzzUZddZahEUYDh61AgMm4Gz9A2219x9Dzoeooy8sU-a86U9UR1irx10k85133wWx-2m1cwyx-dCxy2m7UbU-0w8nxbDCBw6sU2Dw6Zw5pzo7S7E6K1dwHwnK0QE9U2cw8KU3uwDw94wcokwb21vwRzoeFUKfwDxIweo7S7Edo&__hblp=0joC2q261izUak26i0z8Ony9Q4bwby2q4FE8poC2i9yp8S5UfXzUGu58Z2po8bCByEhgCuAnzSi15BxW264U4G58c9o9HBxm25a5V8Sq68vLzbzK2Sfw825UiVVFk12Bw9C0KecwFwUxy7EhwbO0TUW13w4lzpHg767E6K3-dwBBzUqwCwbC2u2u7U6O0yXxOawbqm265UfUei0NG4o5u1ownU9EV39EO2qubxaq6-6O6xGdz87zxW3m&__comet_req=7&fb_dtsg=NAfsw0EOggoIKtvgXaHs1NkJXX1AoXrShPZHnpeLWS15KtqqHKtP7PQ%3A17864642926059691%3A1750868749&jazoest=26388&lsd=${lsd}&__spin_r=1024253163&__spin_b=trunk&__spin_t=${Math.floor(Date.now() / 1000)}&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsTabContentQuery_connection&variables=%7B%22after%22%3A%22${after}%22%2C%22before%22%3Anull%2C%22data%22%3A%7B%22count%22%3A12%2C%22include_reel_media_seen_timestamp%22%3Atrue%2C%22include_relationship_info%22%3Atrue%2C%22latest_besties_reel_media%22%3Atrue%2C%22latest_reel_media%22%3Atrue%7D%2C%22first%22%3A12%2C%22last%22%3Anull%2C%22username%22%3A%22${username}%22%2C%22__relay_internal__pv__PolarisIsLoggedInrelayprovider%22%3Atrue%2C%22__relay_internal__pv__PolarisShareSheetV3relayprovider%22%3Atrue%7D&server_timestamps=true&doc_id=24796768439926139`,
    method: "POST",
  });

  const json = await paginationRes.json();

  /*
  Temporarily commented out until we find a new solution
  const variables = encodeURIComponent(
    JSON.stringify({ after, first: 12, username }),
  );
  const body = `variables=${variables}&dpr=3`;
  const json = await postJSON(
    "https://www.instagram.com/graphql/query?doc_id=24796768439926139",
    body,
  );
  */

  const timeline =
    json.data?.xdt_api__v1__feed__user_timeline_graphql_connection;
  if (!timeline) return { posts: [], hasMore: false, nextCursor: null };

  const posts = timeline.edges.map(({ node }) => ({
    id: node.id,
    caption: node.caption?.text || "",
    display_url: node.image_versions2?.candidates?.[0]?.url || null,
    is_video: node.media_type === 2 || node.video_versions !== null,
    video_url: node.video_versions?.[0]?.url || null,
    thumbnail_url: node.image_versions2?.candidates?.[0]?.url || null,
  }));

  return {
    posts,
    hasMore: timeline.page_info.has_next_page,
    nextCursor: timeline.page_info.end_cursor,
  };
}

// Fetch comments
async function fetchComments(postId) {
  setLsdHeader(headers["x-fb-lsd"]);

  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/media/${postId}/comments/?can_support_threading=true&permalink_enabled=false`,
      {
        headers: headers,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
      },
    );

    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    throw err;
  }
}

// Fetch full profile data
async function fetchProfile(username) {
  let userId;
  let jazoest;

  /* <script id="__eqmc" type="application/json" nonce="">{"u":"\/ajax\/qm\/?__a=1&__user=0&__comet_req=15&jazoest=2987","e":"7523509150521564177","s":"XInstagramLoginSyncController","w":0,"f":null,"l":"AVr0SnTu_Fs"}</script> */

  if (!userId) {
    const page = await fetch(`https://www.instagram.com/${username}`, {
      headers,
    });
    const html = await page.text();

    const searchString = '"props":{"id":"';
    const startIndex = html.indexOf(searchString);

    if (startIndex !== -1) {
      const valueStart = startIndex + searchString.length;
      const valueEnd = html.indexOf('"', valueStart);
      userId = html.substring(valueStart, valueEnd);
    }

    const lsdSearchString = '["LSD",[],{"token":"';
    const lsdStartIndex = html.indexOf(lsdSearchString);

    if (lsdStartIndex !== -1) {
      const lsdValueStart = lsdStartIndex + lsdSearchString.length;
      const lsdValueEnd = html.indexOf('"', lsdValueStart);
      lsd = html.substring(lsdValueStart, lsdValueEnd);
    }

    setLsdHeader(lsd);

    // Extract jazoest from the same HTML response
    const jazoestSearchString = "jazoest=";
    const jazoestStartIndex = html.indexOf(jazoestSearchString);

    if (jazoestStartIndex !== -1) {
      const jazoestValueStart = jazoestStartIndex + jazoestSearchString.length;
      const jazoestValueEnd = html.indexOf("&", jazoestValueStart);
      const jazoestEndIndex =
        jazoestValueEnd !== -1
          ? jazoestValueEnd
          : html.indexOf('"', jazoestValueStart);
      jazoest = html.substring(jazoestValueStart, jazoestEndIndex);
    }

    const csrfSearchString = '{"csrf_token":"';
    const csrfStartIndex = html.indexOf(csrfSearchString);

    if (csrfStartIndex !== -1) {
      const csrfValueStart = csrfStartIndex + csrfSearchString.length;
      const csrfValueEnd = html.indexOf('"', csrfValueStart);
      const csrfEndIndex =
        csrfValueEnd !== -1 ? csrfValueEnd : html.indexOf('"', csrfValueStart);
      csrf = html.substring(csrfValueStart, csrfEndIndex);
      headers = { ...headers, "x-csrftoken": csrf };
    }
  }

  const initialRes = await fetch("https://www.instagram.com/graphql/query", {
    headers: headers,
    body: `av=17841475430069406&__d=www&__user=0&__a=1&__req=8&__hs=20265.HYP%3Ainstagram_web_pkg.2.1...0&dpr=3&__ccg=GOOD&__rev=1024220156&__s=mttwle%3A2pb3g0%3Ayqktjw&__hsi=7520308877564002949&__dyn=7xeUjG1mxu1syUbFp41twWwIxu13wvoKewSAwHwNw9G2S7o1g8hw2nVE4W0qa0FE2awgo9oO0n24oaEnxO1ywOwv89k2C1Fwc60D87u3ifK0EUjwGzEaE2iwNwmE2eUlwhEe87q0oa2-azo7u3vwDwHg2ZwrUdUbGwmk0zU8oC1Iwqo5p0OwUQp1yUb8jxKi2K7E5y4UrwHwcObyohw4rxO2Cq2K&__csr=gmMhhdjsaZ8t49T4Zk_tAWtGWHHFYGRbrHhdqiXBAgKhpTAVpFpaGl4z4vADAoDK8N0zBQHm44CiKidVHB8jLQ8hV8GahGQiKFlWzKiFEgBGaTBBmfxbK6Sagy2CUZr8UoGcByZByVlDDufyFoGfyJqJeq9h5xG48CicDgOi48ix2u7rAwSyo1cE01nA60O920mEg4yU9Q2C9BoOu11w4Qxne1Jo8rK1_yFA0IUaE4W0BO02o8660gu046E0ON0ywCU8i4yPwcG1N84k1tgf62ow8Ukg13k6ElP5Cw2xpBo24Rgqhk0kOm2egC7o5epe00AkE0kmw0Ddw&__hsdp=l0ZqugiyOT5PT2sTpygI4BUy9yGEy569jCwgEvhaboS4p2eKAEK42akSV8Gz5aldwqW9auAFoybU6y76ewhU98IGyobUhKbxOUC4pGw8up3h0d87y2bwWoN0i88aDByprx2i261qw9rwbe0g20TE12E1k8kwdy0J82_xC1Hwyw9S0EEG0Wtwio6e3G0wU9o6CibwAy3wQwRU76i2e0Io&__hblp=0lU5m1dxy4U3hgvwdu7E6K8x21pAG7oOfBwXGUy5FryoCuqAm5E6K4UC7EiwGw_CCwy8bwJpFlwhEmyo8bx2i263Hxum6Enwo-3m3C13wxwdW0w8lwhU3Rxi1EwMCwaOEN6wdy3u8wrF988E5m11xC1Hwyw9S0EEG1rw8To88a8K9wjoeE23Bx-7U4GWy899IV8qxiU8Ud8aE8p8pyo6i2ebxO&__comet_req=7&fb_dtsg=NAfsx5NycqI73lQUzHzE9pnLBuZJ_Oc_uSjVkHL-et-gvDUxAfOVK8w%3A17864642926059691%3A1750868749&jazoest=${jazoest}&lsd=${lsd}&__spin_r=1024220156&__spin_b=trunk&__spin_t=${Math.floor(Date.now() / 1000)}&__crn=comet.igweb.PolarisProfilePostsTabRoute&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisProfilePostsQuery&variables=%7B%22data%22%3A%7B%22count%22%3A12%2C%22include_reel_media_seen_timestamp%22%3Atrue%2C%22include_relationship_info%22%3Atrue%2C%22latest_besties_reel_media%22%3Atrue%2C%22latest_reel_media%22%3Atrue%7D%2C%22username%22%3A%22${username}%22%2C%22__relay_internal__pv__PolarisIsLoggedInrelayprovider%22%3Atrue%2C%22__relay_internal__pv__PolarisShareSheetV3relayprovider%22%3Atrue%7D&server_timestamps=true&doc_id=23905326119127169`,
    method: "POST",
  });
  const initial = await initialRes.json();

  // 1) Timeline + possible userID
  /*
  Temporarily commented out
  const initial = await postJSON(
    "https://www.instagram.com/graphql/query?doc_id=24796768439926139",
    `variables=${encodeURIComponent(JSON.stringify({ first: 12, after: "", username }))}&dpr=3`,
  );
  */

  let timeline =
    initial.data?.xdt_api__v1__feed__user_timeline_graphql_connection;
  userId =
    timeline?.edges?.[0]?.node?.user?.pk ||
    timeline?.edges?.[0]?.node?.owner?.pk;

  if (!userId)
    throw Object.assign(new Error("User not found"), { status: 404 });

  // Enhance timeline posts
  const enhanced = (timeline?.edges || []).map((edge) => ({
    ...edge,
    node: {
      ...edge.node,
      is_video: edge.node.media_type === 2 || edge.node.video_versions !== null,
      video_url: edge.node.video_versions?.[0]?.url || null,
      image_url: edge.node.image_versions2?.candidates?.[0]?.url || null,
      display_url: edge.node.image_versions2?.candidates?.[0]?.url || null,
      media_type: edge.node.video_versions ? "video" : "image",
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

module.exports = { fetchImage, fetchPosts, fetchProfile, fetchComments };

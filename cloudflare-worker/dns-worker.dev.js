/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         LOCKET GOLD - ANTI REVOKE DNS WORKER                ║
 * ║         by @tduc  |  Cloudflare Worker DoH Server           ║
 * ║                                                              ║
 * ║  Máy chủ DNS-over-HTTPS tùy chỉnh chạy trên Cloudflare.    ║
 * ║  Chặn RevenueCat để bảo vệ Locket Gold khỏi bị thu hồi.    ║
 * ║  Upstream: Cloudflare 1.1.1.1 (nhanh nhất thế giới)        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Worker URL: https://locketgold.duc-lht-dev.workers.dev/dns-query
 * Health:     https://locketgold.duc-lht-dev.workers.dev/health
 * Blocked:    https://locketgold.duc-lht-dev.workers.dev/blocked
 */

// ================================================================
// DANH SÁCH DOMAIN BỊ CHẶN (trả về 0.0.0.0)
// ================================================================
const BLOCKED_DOMAINS = new Set([
  // 1. RevenueCat - Hệ thống xác thực và thu hồi gói Gold
  "api.revenuecat.com",
  "app.revenuecat.com",
  "revenuecat.com",
  "www.revenuecat.com",
  "purchases.revenuecat.com",
  "backend.revenuecat.com",
  "sdk.revenuecat.com",

  // 2. Telemetry, Analytics & User Tracking của Locket
  "in.appcenter.ms",
  "app-measurement.com",
  "mixpanel.com",
  "api.mixpanel.com",
  "firebaselogging-pa.googleapis.com",
  "firebaselogging.googleapis.com",
  "ingest.sentry.io",
  "api2.amplitude.com",
  "appsflyersdk.com",
  "oy24bn.skadsdkless.appsflyersdk.com",

  // 3. Apple Certificate Anti-Revoke (Chống thu hồi chứng chỉ)
  "certs.apple.com",
  "crl.apple.com",
  "ocsp.apple.com",
  "ocsp2.apple.com",
]);

// ================================================================
// DANH SÁCH DOMAIN LUÔN MỞ (whitelist - ưu tiên trên BLOCKED)
// Dùng khi bạn cần override một subdomain bị chặn nhầm
// ================================================================
const ALWAYS_ALLOWED_DOMAINS = new Set([
  // Firebase - BẮT BUỘC mở để Locket tải config Gold features
  "firebaseremoteconfig.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "firestore.googleapis.com",
  "firebase.googleapis.com",
  "fcmregistrations.googleapis.com",
  "locket-4252a.firebaseio.com",

  // Locket API - BẮT BUỘC mở để gửi/nhận ảnh
  "api.locketcamera.com",
  "locketcamera.com",

  // Apple - BẮT BUỘC mở để iPhone hoạt động bình thường
  "apple.com",
  "icloud.com",
  "push.apple.com",
]);

// ================================================================
// UPSTREAM DNS - Cloudflare 1.1.1.1 (DoH chuẩn)
// ================================================================
const UPSTREAM_DOH = "https://1.1.1.1/dns-query";

// ================================================================
// HÀM KIỂM TRA DOMAIN (hỗ trợ wildcard subdomain)
// ================================================================
function isDomainBlocked(domain) {
  const d = domain.toLowerCase().replace(/\.$/, ""); // bỏ trailing dot

  // Kiểm tra whitelist trước (ưu tiên cao nhất)
  if (ALWAYS_ALLOWED_DOMAINS.has(d)) return false;
  for (const allowed of ALWAYS_ALLOWED_DOMAINS) {
    if (d.endsWith("." + allowed)) return false;
  }

  // Kiểm tra blocklist
  if (BLOCKED_DOMAINS.has(d)) return true;
  for (const blocked of BLOCKED_DOMAINS) {
    if (d.endsWith("." + blocked)) return true; // chặn luôn mọi subdomain
  }

  return false;
}

// ================================================================
// TẠO DNS RESPONSE GIẢ (NXDOMAIN-style trả về 0.0.0.0)
// ================================================================
function buildBlockResponse(domain, qtype) {
  // JSON DNS Response theo RFC 8484
  return {
    Status: 0,
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
    Question: [{ name: domain + ".", type: qtype }],
    Answer: qtype === 1
      ? [{ name: domain + ".", type: 1, TTL: 300, data: "0.0.0.0" }]
      : [], // IPv6: trả rỗng thay vì :: để tránh một số bug iOS
    Comment: "Blocked by TducGold DNS Worker - @tduc",
  };
}

// ================================================================
// HANDLER CHÍNH
// ================================================================
async function handleRequest(request) {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");

  // CORS headers - cần thiết cho một số client
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
  };

  // OPTIONS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Health check endpoint - dùng để test server còn sống không
  if (url.pathname === "/health" || url.pathname === "/") {
    return new Response(
      JSON.stringify({
        status: "ok",
        name: "TducGold Anti-Revoke DNS",
        author: "@tduc",
        blocked_count: BLOCKED_DOMAINS.size,
        upstream: UPSTREAM_DOH,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Stats endpoint - xem danh sách blocked domains
  if (url.pathname === "/blocked") {
    return new Response(
      JSON.stringify({
        blocked_domains: [...BLOCKED_DOMAINS],
        always_allowed: [...ALWAYS_ALLOWED_DOMAINS],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Chỉ xử lý /dns-query endpoint
  if (url.pathname !== "/dns-query") {
    return new Response("Not Found", { status: 404 });
  }

  try {
    // ── Chế độ GET: ?name=xxx&type=A (DNS JSON - RFC 8484)
    if (request.method === "GET") {
      const name = url.searchParams.get("name");
      const type = url.searchParams.get("type") || "A";
      const qtype = parseInt(type) || (type === "AAAA" ? 28 : type === "HTTPS" ? 65 : 1);

      if (!name) {
        return new Response("Missing 'name' parameter", { status: 400 });
      }

      const domain = name.toLowerCase().replace(/\.$/, "");

      // Kiểm tra domain có bị chặn không
      if (isDomainBlocked(domain)) {
        console.log(`[BLOCKED] ${domain}`);
        return new Response(JSON.stringify(buildBlockResponse(domain, qtype)), {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/dns-json",
            "Cache-Control": "public, max-age=300",
          },
        });
      }

      // Forward lên upstream
      console.log(`[ALLOWED] ${domain}`);
      const upstreamUrl = `${UPSTREAM_DOH}?name=${encodeURIComponent(name)}&type=${type}`;
      const upstreamRes = await fetch(upstreamUrl, {
        headers: { Accept: "application/dns-json" },
        cf: { cacheTtl: 60, cacheEverything: true },
      });

      const data = await upstreamRes.text();
      return new Response(data, {
        status: upstreamRes.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/dns-json",
        },
      });
    }

    // ── Chế độ POST: DNS wire format (RFC 8484 binary)
    if (request.method === "POST") {
      const contentType = request.headers.get("Content-Type") || "";
      if (!contentType.includes("application/dns-message")) {
        return new Response("Unsupported Content-Type", { status: 415 });
      }

      const body = await request.arrayBuffer();

      // Parse tên miền từ DNS wire format (để kiểm tra blocklist)
      const domain = parseDomainFromWireFormat(new Uint8Array(body));
      const qtype = parseQTypeFromWireFormat(new Uint8Array(body));

      if (domain && isDomainBlocked(domain)) {
        console.log(`[BLOCKED-POST] ${domain}`);
        // Tạo DNS wire format response với 0.0.0.0
        const blockWireResponse = buildBlockWireResponse(new Uint8Array(body));
        return new Response(blockWireResponse, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/dns-message",
            "Cache-Control": "public, max-age=300",
          },
        });
      }

      // Forward POST lên upstream
      const upstreamRes = await fetch(UPSTREAM_DOH, {
        method: "POST",
        headers: { "Content-Type": "application/dns-message" },
        body: body,
        cf: { cacheTtl: 30 },
      });

      const responseData = await upstreamRes.arrayBuffer();
      return new Response(responseData, {
        status: upstreamRes.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/dns-message",
        },
      });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (err) {
    console.error("Worker error:", err);
    // Nếu lỗi, fallback về Cloudflare để tránh tắt mạng iPhone
    try {
      const fallbackUrl = `${UPSTREAM_DOH}${url.search}`;
      const fallbackRes = await fetch(fallbackUrl, {
        headers: { Accept: "application/dns-json" },
      });
      return new Response(await fallbackRes.text(), {
        status: fallbackRes.status,
        headers: { "Content-Type": "application/dns-json" },
      });
    } catch {
      return new Response("DNS server error", { status: 503 });
    }
  }
}

// ================================================================
// PARSE DNS WIRE FORMAT - lấy domain name từ binary DNS packet
// ================================================================
function parseDomainFromWireFormat(bytes) {
  try {
    // DNS Header = 12 bytes, sau đó là Question section
    let pos = 12;
    const labels = [];
    let safetyLimit = 0;

    while (pos < bytes.length && safetyLimit++ < 128) {
      const len = bytes[pos];
      if (len === 0) break;
      if ((len & 0xc0) === 0xc0) break; // pointer - bỏ qua
      pos++;
      const label = new TextDecoder().decode(bytes.slice(pos, pos + len));
      labels.push(label);
      pos += len;
    }

    return labels.length > 0 ? labels.join(".").toLowerCase() : null;
  } catch {
    return null;
  }
}

function parseQTypeFromWireFormat(bytes) {
  try {
    let pos = 12;
    let safetyLimit = 0;
    while (pos < bytes.length && safetyLimit++ < 128) {
      const len = bytes[pos];
      if (len === 0) { pos++; break; }
      if ((len & 0xc0) === 0xc0) { pos += 2; break; }
      pos += 1 + len;
    }
    return (bytes[pos] << 8) | bytes[pos + 1];
  } catch {
    return 1;
  }
}

// ================================================================
// BUILD DNS WIRE FORMAT BLOCK RESPONSE (trả 0.0.0.0)
// ================================================================
function buildBlockWireResponse(queryBytes) {
  // Copy header từ query, set QR=1 (response), RCODE=0
  const response = new Uint8Array(queryBytes.length + 16);
  response.set(queryBytes.slice(0, 12)); // copy header
  response[2] = 0x81; // QR=1, AA=0, TC=0, RD=1
  response[3] = 0x80; // RA=1, RCODE=0
  response[6] = 0x00; // ANCOUNT high
  response[7] = 0x01; // ANCOUNT = 1
  // Copy question section
  response.set(queryBytes.slice(12), 12);
  // Append answer: pointer to question name + TYPE A + CLASS IN + TTL 300 + RDLENGTH 4 + 0.0.0.0
  const answerStart = queryBytes.length;
  response[answerStart] = 0xc0;    // pointer
  response[answerStart + 1] = 0x0c; // points to offset 12 (question name)
  response[answerStart + 2] = 0x00; response[answerStart + 3] = 0x01; // TYPE A
  response[answerStart + 4] = 0x00; response[answerStart + 5] = 0x01; // CLASS IN
  response[answerStart + 6] = 0x00; response[answerStart + 7] = 0x00; // TTL high
  response[answerStart + 8] = 0x01; response[answerStart + 9] = 0x2c; // TTL = 300
  response[answerStart + 10] = 0x00; response[answerStart + 11] = 0x04; // RDLENGTH = 4
  response[answerStart + 12] = 0x00; response[answerStart + 13] = 0x00; // 0.0
  response[answerStart + 14] = 0x00; response[answerStart + 15] = 0x00; // 0.0
  return response.buffer;
}

// ================================================================
// ENTRY POINT
// ================================================================
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});


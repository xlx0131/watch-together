// Cloudflare Pages Function: 代理 maccms10 资源站（列表/详情/搜索），解决浏览器跨域。
// 前端调用：/api/video/proxy?source=<key>&ac=list|videolist|detail&wd=...&ids=...&t=...&pg=...
const SOURCES = {
  ffzy: { name: '非凡云', baseUrl: 'https://api.ffzyapi.com/api.php/provide/vod', enabled: true },
  subo: { name: '速播', baseUrl: 'https://www.suboziyuan.net/api.php/provide/vod', enabled: true },
  ikun: { name: '非凡云(ikun)', baseUrl: 'https://api.ffzyapi.com/api.php/provide/vod', enabled: true },
  modu: { name: '魔都云', baseUrl: 'http://mdzyapi.com/api.php/provide/vod', enabled: true },
  subocaiji: { name: '速播云', baseUrl: 'http://subocaiji.com/api.php/provide/vod', enabled: true },
  youzhi: { name: '优质云', baseUrl: 'http://api.yzzy-api.com/api.php/provide/vod', enabled: true },
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (request.method !== 'GET') {
    return json({ success: false, error: '不支持的请求方法' }, 405);
  }

  try {
    const source = url.searchParams.get('source');
    if (!source) return json({ success: false, error: '缺少 source 参数' }, 400);

    const sourceConfig = SOURCES[source];
    if (!sourceConfig) return json({ success: false, error: '资源站不存在' }, 404);
    if (!sourceConfig.enabled) return json({ success: false, error: '资源站已禁用' }, 403);

    const params = new URLSearchParams(url.searchParams);
    params.delete('source');
    params.delete('path');
    const queryString = params.toString();
    const targetUrl = sourceConfig.baseUrl + (queryString ? '?' + queryString : '');

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': sourceConfig.baseUrl,
      },
    });

    if (!response.ok) {
      return json({ success: false, error: '上游请求失败: ' + response.status }, response.status);
    }
    const data = await response.json();
    return json({ success: true, data });
  } catch (e) {
    return json({ success: false, error: e.message || '服务器错误' }, 500);
  }
}

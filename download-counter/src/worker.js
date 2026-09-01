const FORMAT_SET = new Set(['xlsx', 'tsv', 'txt']);

function jsonResponse(payload, status, origin, env) {
  const headers = corsHeaders(origin, env);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');

  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers,
    },
  );
}

function configuredOrigins(env) {
  return new Set(
    String(env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function corsHeaders(origin, env) {
  const headers = new Headers();
  const allowed = configuredOrigins(env);

  if (origin && allowed.has(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }

  headers.set(
    'access-control-allow-methods',
    'GET, POST, OPTIONS',
  );

  headers.set(
    'access-control-allow-headers',
    'content-type',
  );

  return headers;
}

function requireOrigin(request, env) {
  const origin = request.headers.get('origin');
  const allowed = configuredOrigins(env);

  if (!origin || !allowed.has(origin)) {
    return null;
  }

  return origin;
}

function parseIdentity(value) {
  if (
    typeof value !== 'string'
    || !/^[A-Za-z0-9._-]{1,80}$/.test(value)
  ) {
    throw new Error('invalid panel identity');
  }

  return value;
}

function parseN(value) {
  const n = Number(value);

  if (
    !Number.isInteger(n)
    || n < 10
    || n > 500
  ) {
    throw new Error('invalid panel size');
  }

  return n;
}

function parseFormat(value) {
  if (
    typeof value !== 'string'
    || !FORMAT_SET.has(value)
  ) {
    throw new Error('invalid download format');
  }

  return value;
}

async function readCounts(env, identity, n) {
  const result = await env.DB.prepare(
    `SELECT format, download_count
       FROM panel_download_counts
      WHERE panel_identity = ?
        AND panel_n = ?`,
  )
    .bind(identity, n)
    .all();

  const formats = {
    xlsx: 0,
    tsv: 0,
    txt: 0,
  };

  for (const row of result.results ?? []) {
    if (FORMAT_SET.has(row.format)) {
      formats[row.format] = Number(row.download_count);
    }
  }

  return {
    identity,
    n,
    total: formats.xlsx + formats.tsv + formats.txt,
    formats,
  };
}

async function incrementCount(env, identity, n, format) {
  await env.DB.prepare(
    `INSERT INTO panel_download_counts (
       panel_identity,
       panel_n,
       format,
       download_count,
       updated_at
     )
     VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(panel_identity, panel_n, format)
     DO UPDATE SET
       download_count = download_count + 1,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(identity, n, format)
    .run();

  return readCounts(
    env,
    identity,
    n,
  );
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin');

    if (request.method === 'OPTIONS') {
      if (!requireOrigin(request, env)) {
        return new Response(
          null,
          {
            status: 403,
          },
        );
      }

      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders(origin, env),
        },
      );
    }

    const acceptedOrigin = requireOrigin(
      request,
      env,
    );

    if (!acceptedOrigin) {
      return jsonResponse(
        {
          error: 'origin not allowed',
        },
        403,
        origin,
        env,
      );
    }

    const url = new URL(request.url);

    if (
      request.method === 'GET'
      && url.pathname === '/v1/counts'
    ) {
      try {
        const identity = parseIdentity(
          url.searchParams.get('identity'),
        );

        const n = parseN(
          url.searchParams.get('n'),
        );

        const payload = await readCounts(
          env,
          identity,
          n,
        );

        return jsonResponse(
          payload,
          200,
          acceptedOrigin,
          env,
        );
      } catch (error) {
        return jsonResponse(
          {
            error: error.message,
          },
          400,
          acceptedOrigin,
          env,
        );
      }
    }

    if (
      request.method === 'POST'
      && url.pathname === '/v1/download'
    ) {
      try {
        const body = await request.json();

        const identity = parseIdentity(
          body.identity,
        );

        const n = parseN(
          body.n,
        );

        const format = parseFormat(
          body.format,
        );

        const payload = await incrementCount(
          env,
          identity,
          n,
          format,
        );

        return jsonResponse(
          payload,
          200,
          acceptedOrigin,
          env,
        );
      } catch (error) {
        return jsonResponse(
          {
            error: error.message,
          },
          400,
          acceptedOrigin,
          env,
        );
      }
    }

    return jsonResponse(
      {
        error: 'not found',
      },
      404,
      acceptedOrigin,
      env,
    );
  },
};

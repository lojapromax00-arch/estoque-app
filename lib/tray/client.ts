/**
 * Tray API client.
 * Credentials come from environment variables — never expose to client.
 */

export interface TrayProduct {
  id?: string;
  nome: string;
  sku?: string;
  preco: number;
  custo?: number;
  estoque?: number;
  descricao?: string;
  marca?: string;
  imagem_url?: string;
}

interface TrayApiResponse {
  Product?: { id: string };
  id?: string;
  [key: string]: unknown;
}

function getCredentials() {
  const apiUrl = process.env.TRAY_API_URL;
  const apiKey = process.env.TRAY_API_KEY;
  const storeId = process.env.TRAY_STORE_ID;

  if (!apiUrl || !apiKey || !storeId) {
    throw new Error(
      "Tray API não configurada. Defina TRAY_API_URL, TRAY_API_KEY e TRAY_STORE_ID."
    );
  }

  return { apiUrl, apiKey, storeId };
}

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
}

function mapToTrayPayload(product: TrayProduct) {
  return {
    Product: {
      title: product.nome,
      reference: product.sku ?? "",
      price: product.preco,
      cost_price: product.custo ?? product.preco * 0.6,
      stock: product.estoque ?? 0,
      description: product.descricao ?? "",
      brand: product.marca ?? "",
      images: product.imagem_url
        ? [{ http: product.imagem_url }]
        : undefined,
    },
  };
}

/**
 * Create a new product in the Tray catalog.
 */
export async function trayCreateProduct(
  product: TrayProduct
): Promise<{ id: string }> {
  const { apiUrl, apiKey, storeId } = getCredentials();
  const url = `${apiUrl}/${storeId}/products`;

  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(mapToTrayPayload(product)),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tray API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as TrayApiResponse;
  const id = data?.Product?.id ?? data?.id;
  if (!id) throw new Error("Tray API não retornou ID do produto criado");
  return { id: String(id) };
}

/**
 * Update an existing product in the Tray catalog.
 */
export async function trayUpdateProduct(
  trayId: string,
  product: Partial<TrayProduct>
): Promise<void> {
  const { apiUrl, apiKey, storeId } = getCredentials();
  const url = `${apiUrl}/${storeId}/products/${trayId}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: buildHeaders(apiKey),
    body: JSON.stringify(mapToTrayPayload(product as TrayProduct)),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tray API error ${res.status}: ${body}`);
  }
}

/**
 * Find a product in Tray by SKU.
 */
export async function trayGetProductBySku(
  sku: string
): Promise<TrayProduct | null> {
  const { apiUrl, apiKey, storeId } = getCredentials();
  const url = `${apiUrl}/${storeId}/products?reference=${encodeURIComponent(sku)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(apiKey),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { Products?: TrayApiResponse[] };
  const first = data?.Products?.[0];
  if (!first) return null;

  return {
    id: String(first.id ?? ""),
    nome: String(first.title ?? ""),
    sku: String(first.reference ?? sku),
    preco: Number(first.price ?? 0),
  };
}

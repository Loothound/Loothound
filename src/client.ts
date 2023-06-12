import { getClient, ResponseType } from "@tauri-apps/api/http";

export default async function mkRequest<T>(endpoint: string, token: string): T {
    const client = await getClient();
    const options = {
      headers: {
        Authorization: "Bearer " + token,
        "User-Agent":
          "OAuth loothound/0.1 (contact: paul.kosel@rub.de) StrictMode",
      },
      responseType: ResponseType.JSON,
    };
    const response = await client.get<T>("https://api.pathofexile.com/" + endpoint, options);
    return response.data;
}
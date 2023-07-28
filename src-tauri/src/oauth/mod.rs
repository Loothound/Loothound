use oauth2::basic::BasicClient;
use oauth2::reqwest::{async_http_client, http_client};
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, CsrfToken, PkceCodeChallenge, RedirectUrl, RefreshToken,
    Scope, TokenResponse, TokenUrl,
};
use tauri::plugin::{Builder, TauriPlugin};
use tauri::{command, Runtime, Window};
use tauri_plugin_oauth::{start_with_config, OauthConfig};
use url::Url;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct RefreshResponse {
    auth_token: String,
    refresh_token: String,
    lifetime: u128,
}

#[command]
async fn do_oauth<R: Runtime>(window: Window<R>) -> Result<u16, String> {
    let client = BasicClient::new(
        ClientId::new("loothound".to_string()),
        None,
        AuthUrl::new("https://www.pathofexile.com/oauth/authorize".to_string()).unwrap(),
        Some(TokenUrl::new("https://www.pathofexile.com/oauth/token".to_string()).unwrap()),
    )
    .set_redirect_uri(RedirectUrl::new("http://localhost:61360/auth".to_string()).unwrap());
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let (auth_url, _) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("account:stashes".to_string()))
        .add_scope(Scope::new("account:league_accounts".to_string()))
        .add_scope(Scope::new("account:characters".to_string()))
        .set_pkce_challenge(pkce_challenge)
        .url();

    let mut verifier_option = Some(pkce_verifier);

    open::that(auth_url.as_str()).unwrap();

    start_with_config(
        OauthConfig {
            ports: Some(vec![61360]),
            response: Some(
                r#"
                <html>
                    <head>
                        <title>Loothound</title>
                    </head>
                    <body>
                        Please close this tab and return to Loothound.
                    </body>
                </html>
            "#
                .into(),
            ),
        },
        move |url| {
            let u = Url::parse(&url).unwrap();
            let mut pairs = u.query_pairs();
            let (_, code) = pairs.next().unwrap();
            let token_result = client
                .exchange_code(AuthorizationCode::new(code.to_string()))
                .set_pkce_verifier(verifier_option.take().unwrap())
                .request(http_client)
                .unwrap();
            println!("{:?}", token_result);
            let _ = window.emit("oauth_token", token_result);
        },
    )
    .map_err(|err| err.to_string())
}

#[command]
async fn attempt_refresh<R: Runtime>(window: Window<R>, refresh_token: String) {
    let client = BasicClient::new(
        ClientId::new("loothound".to_string()),
        None,
        AuthUrl::new("https://www.pathofexile.com/oauth/authorize".to_string()).unwrap(),
        Some(TokenUrl::new("https://www.pathofexile.com/oauth/token".to_string()).unwrap()),
    )
    .set_redirect_uri(RedirectUrl::new("http://localhost:61360/auth".to_string()).unwrap());
    let resp = client
        .exchange_refresh_token(&RefreshToken::new(refresh_token))
        .request_async(async_http_client)
        .await;

    match resp {
        Ok(token) => {
            println!("{:?}", token);
            window.emit("oauth_token", token).unwrap();
        }
        Err(_) => (),
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("oauth")
        .invoke_handler(tauri::generate_handler![do_oauth, attempt_refresh])
        .build()
}

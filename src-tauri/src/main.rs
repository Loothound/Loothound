// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{command, Window};
use tauri_plugin_oauth::{start_with_config, OauthConfig};
use url::Url;

use oauth2::basic::BasicClient;
use oauth2::curl::http_client;
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, CsrfToken, HttpRequest, HttpResponse, PkceCodeChallenge,
    RedirectUrl, Scope, TokenResponse, TokenUrl,
};

fn my_client(request: HttpRequest) -> Result<HttpResponse, oauth2::curl::Error> {
    println!("{:?}", request);
    let response = http_client(request);
    if let Ok(r) = response {
        let buf = &r.body;
        let s = match std::str::from_utf8(buf) {
            Ok(v) => v,
            Err(e) => panic!("Invalid utf-8 sequence"),
        };
        println!("{:?}", s);
        return Ok(r);
    } else {
        return Err(response.err().expect("oopsie"));
    }
}

#[command]
async fn do_oauth(app: tauri::AppHandle, window: Window) -> Result<u16, String> {
    let client = BasicClient::new(
        ClientId::new("loothound".to_string()),
        None,
        AuthUrl::new("https://www.pathofexile.com/oauth/authorize".to_string()).unwrap(),
        Some(TokenUrl::new("https://www.pathofexile.com/oauth/token".to_string()).unwrap()),
    )
    .set_redirect_uri(RedirectUrl::new("http://localhost:61360/auth".to_string()).unwrap());
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let (auth_url, csrf_token) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("account:stashes".to_string()))
        .add_scope(Scope::new("account:league_accounts".to_string()))
        .add_scope(Scope::new("account:characters".to_string()))
        .set_pkce_challenge(pkce_challenge)
        .url();

    let mut verifier_option = Some(pkce_verifier);

    let oauth_window =
        tauri::WindowBuilder::new(&app, "oauth_window", tauri::WindowUrl::External(auth_url))
            .build()
            .unwrap();

    start_with_config(
        OauthConfig {
            ports: Some(vec![61360]),
            response: None,
        },
        move |url| {
            oauth_window.close().unwrap();
            let u = Url::parse(&url).unwrap();
            let mut pairs = u.query_pairs();
            let (_, code) = pairs.next().unwrap();
            let token_result = client
                .exchange_code(AuthorizationCode::new(code.to_string()))
                .set_pkce_verifier(verifier_option.take().unwrap())
                .request(my_client)
                .unwrap();
            println!("{:?}", token_result);
            let _ = window.emit("oauth_token", token_result);
        },
    )
    .map_err(|err| err.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![do_oauth])
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

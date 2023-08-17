use std::{
    ffi::OsStr,
    fs::{self, File},
    io::Write,
};

fn main() {
    tauri_build::build();

    println!("cargo:rerun-if-changed=src/sql/model.rs");

    let mut exports: Vec<String> = fs::read_dir("../src/bindings")
        .unwrap()
        .filter_map(Result::ok)
        .filter_map(|p| {
            p.path()
                .file_stem()
                .map(OsStr::to_str)
                .flatten()
                .map(str::to_owned)
        })
        .filter(|f| f != "index")
        .map(|f| format!("export * from \"./{}\"", f))
        .collect::<Vec<String>>();

    exports.sort();

    let mut file = File::create("../src/bindings/index.ts").unwrap();
    file.write_all(
        vec![
            "// This file was automatically generated.",
            "// Do not edit it manually.",
            "",
            "",
        ]
        .join("\n")
        .as_bytes(),
    )
    .unwrap();
    file.write_all(exports.join("\n").as_bytes()).unwrap();
}

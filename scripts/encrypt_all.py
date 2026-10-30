#!/usr/bin/env python3
"""
TducGold Master Encryption Tool
Dùng công cụ này để tự động mã hóa tất cả các script JavaScript:
- js/Locket_tduc.dev.js       -> js/Locket_tduc.js
- js/Locket_Unlocked.dev.js   -> js/Locket_Unlocked.js
- js/deleteHeader.dev.js      -> js/deleteHeader.js
- js/Locket_rc_us.dev.js      -> js/Locket_rc_us.js
- cloudflare-worker/dns-worker.dev.js -> cloudflare-worker/dns-worker.js
"""

import base64
import os

SCRIPTS = [
    {
        "src": "js/Locket_tduc.dev.js",
        "dst": "js/Locket_tduc.js",
        "name": "Locket Gold Core Engine",
        "key": 0x4d,
        "author": "@tduc",
        "version": "3.5.0"
    },
    {
        "src": "js/deleteHeader.dev.js",
        "dst": "js/deleteHeader.js",
        "name": "Locket Header Stripper",
        "key": 0x3a,
        "author": "@tduc",
        "version": "2.0.0"
    },
    {
        "src": "js/Locket_Unlocked.dev.js",
        "dst": "js/Locket_Unlocked.js",
        "name": "Locket Feature Gates & Remote Config",
        "key": 0x6b,
        "author": "@tduc",
        "version": "4.0.0"
    },
    {
        "src": "js/Locket_rc_us.dev.js",
        "dst": "js/Locket_rc_us.js",
        "name": "Locket Region Controller",
        "key": 0x55,
        "author": "@tduc",
        "version": "2.2.0"
    }
]

def encrypt_file(cfg):
    if not os.path.exists(cfg["src"]):
        print(f"⚠️  Skip: {cfg['src']} not found")
        return
        
    with open(cfg["src"], "rb") as f:
        data = f.read()
    
    key = cfg["key"]
    xored = bytes([b ^ key for b in data])
    b64 = base64.b64encode(xored).decode('ascii')
    
    chunks = [b64[i:i+120] for i in range(0, len(b64), 120)]
    chunk_str = "\n  " + " +\n  ".join(f'"{c}"' for c in chunks)
    
    obf_code = f"""/**
 * ==============================================================================
 * @project     {cfg["name"]}
 * @author      {cfg["author"]}
 * @version     {cfg["version"]} (Enterprise Protected)
 * @license     Proprietary - Unauthorized Modification or Redistribution Prohibited
 * ==============================================================================
 */
(function(_0xreq,_0xres,_0xdone){{var _0xk={hex(key)};var _0xd={chunk_str};var _0xb=atob(_0xd);var _0xu=new Uint8Array(_0xb.length);for(var _0xi=0;_0xi<_0xb.length;_0xi++){{_0xu[_0xi]=_0xb.charCodeAt(_0xi)^_0xk;}}var _0xc=new TextDecoder('utf-8').decode(_0xu);(new Function('$request','$response','$done',_0xc))(_0xreq,_0xres,_0xdone);}})(typeof $request!=='undefined'?$request:{{}},typeof $response!=='undefined'?$response:{{}},typeof $done!=='undefined'?$done:function(){{}});
"""
    with open(cfg["dst"], "w") as f:
        f.write(obf_code)
    
    print(f"🔒 [Encrypted] {cfg['src']} -> {cfg['dst']} (Size: {len(data)} -> {len(obf_code)} bytes)")

if __name__ == "__main__":
    print("=" * 65)
    print("  TDUC GOLD - FULL ENCRYPTION PIPELINE")
    print("=" * 65)
    for s in SCRIPTS:
        encrypt_file(s)
    print("=" * 65)
    print("✨ Toàn bộ script đã được mã hóa an toàn 100%!")

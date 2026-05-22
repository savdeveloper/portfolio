# sav.dev

meu portfolio pessoal · [iamsav.dev](https://www.iamsav.dev)

site estatico em HTML / CSS / JS puro, sem framework. queria algo leve, rapido e com cara de terminal.

## stack

- HTML, CSS, JS (vanilla)
- fontes: space grotesk + jetbrains mono
- form de contato: edge function no supabase + resend pra enviar email
- anti-bot: cloudflare turnstile + honeypot + rate limit
- hospedagem: vercel
- dominio: iamsav.dev

## rodando local

so abrir o `index.html` no navegador. nao precisa de build, nem de node.

```bash
git clone https://github.com/savdeveloper/savdev.git
cd savdev
# abre o index.html ou roda um server qualquer:
python3 -m http.server 8000
```

## estrutura

```
.
├── index.html
├── vercel.json
└── assets/
    ├── css/styles.css
    ├── js/main.js
    └── img/
```

## contato

- e-mail: sav@iamsav.dev
- discord: @vulgosav
- instagram: @iamsav.dev

---

feito com ♥ por sav

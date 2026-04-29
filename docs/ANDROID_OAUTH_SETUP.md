# Login Google no app Android (Capacitor) — Setup OAuth

## Contexto

No app web (`korafinance.app`), o login com Google usa o broker gerenciado
do Lovable Cloud (`/~oauth/initiate`). Esse endpoint **não existe dentro
do WebView do Capacitor** (lá `window.location.origin` é
`capacitor://localhost`), então o botão "Entrar com Google" no APK/AAB da
Play Store dava **404**.

## Solução implementada

Fluxo híbrido: o app nativo abre o login Google no **navegador externo**
(Custom Tab) apontando pro site web; depois de autenticar, o site
devolve os tokens pro app via **deep link**.

```
APK Android  ──Browser.open──▶  https://korafinance.app/login?native_oauth=1
                                        │
                                        ▼
                                 Lovable OAuth broker → Google → sessão Supabase
                                        │
                                        ▼
                NativeOAuthForwarder detecta a flag e redireciona para:
                com.korafinance.app://auth-callback#at=...&rt=...
                                        │
                                        ▼
                  Android entrega o deep link pra MainActivity
                                        │
                                        ▼
              App.addListener("appUrlOpen") em src/lib/nativeOAuth.ts
                  → supabase.auth.setSession(tokens) → /app
```

## O que mudou no repo

| Arquivo | O quê |
|---|---|
| `src/lib/nativeOAuth.ts` | `signInWithGoogleNative()` + listener `appUrlOpen` |
| `src/components/auth/NativeOAuthForwarder.tsx` | Detecta sessão e redireciona pro deep link |
| `src/pages/LoginPage.tsx` / `RegisterPage.tsx` | Em Capacitor, chama `signInWithGoogleNative()` |
| `src/main.tsx` | Instala `installNativeOAuthListener()` no boot |
| `package.json` | Deps `@capacitor/browser` e `@capacitor/app` |
| `.github/workflows/android-release.yml` | Etapa **"Patch AndroidManifest.xml (deep link OAuth)"** que injeta o intent-filter no build |

**Nota importante:** a pasta `android/` **não está versionada**. Ela é
regenerada a cada build pelo `npx cap add android`. Por isso o patch do
`AndroidManifest.xml` mora no workflow do GitHub Actions e não em commit
manual. Não edite o Manifest localmente — qualquer edição é descartada.

### Intent-filter injetado

```xml
<intent-filter android:autoVerify="false">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.korafinance.app" android:host="auth-callback" />
</intent-filter>
```

## Google Cloud Console — precisa configurar?

**TL;DR: NÃO precisa criar OAuth client específico pra Android.**

Por quê: o broker do Lovable Cloud usa o **OAuth client web** dele pra
falar com o Google. O Google nunca vê o scheme
`com.korafinance.app://`. Pra ele, quem fez login foi o site
`korafinance.app` (mesmo redirect_uri de sempre). Quem entrega os tokens
pro app via deep link é a **nossa** página web — não o Google.

Ou seja, o scheme `com.korafinance.app://auth-callback` é **interno**
(Android ↔ web ↔ app). Não precisa registrar em lugar nenhum no Google
Cloud Console.

### Quando você PRECISARIA mexer no Google Cloud Console

Só nesses dois cenários (não é o nosso caso hoje):

1. **Se você quisesse usar o Google Sign-In nativo do Android** (sem
   passar pelo navegador) — usaria o plugin `@codetrix-studio/capacitor-google-auth`
   ou similar e teria que registrar um **OAuth client tipo Android** com
   o SHA-1 do seu keystore.
2. **Se você quisesse trocar o broker do Lovable pelo seu próprio OAuth
   client web** — registraria um Web Client e configuraria os
   redirect_uris do Lovable Cloud nele.

Como mantemos o broker gerenciado e o fluxo via Custom Tab, **nada a
fazer no Google Cloud Console**.

## Como testar após o próximo build

1. Confirme que a versão web (`korafinance.app`) já foi publicada com o
   `NativeOAuthForwarder` (botão Publish → Update na Lovable).
2. Rode o workflow **Build Android Release (.aab)** no GitHub Actions.
3. Confira nos logs do step **"Patch AndroidManifest.xml (deep link
   OAuth)"** que aparece `Intent-filter OAuth injetado com sucesso` (ou
   `já presente — skip` em re-runs).
4. Baixe o `.aab` do artifact, suba na Play Store (faixa interna ou
   produção), instale no celular.
5. Abra o app → Entrar com Google → o Chrome deve abrir → faça login →
   ao terminar, o Chrome fecha sozinho e o app abre logado em `/app`.

## Como debugar se ainda der problema

### Sintoma: clica em "Google" e nada acontece
- Confirme que `@capacitor/browser` foi instalado (deveria estar no
  `package.json`).
- Veja o log do `Browser.open` em `chrome://inspect` (USB debug do Android).

### Sintoma: Chrome abre, login funciona, mas o app não reabre
- Problema no intent-filter. Conecte o celular via USB e rode:
  ```
  adb shell pm dump com.korafinance.app | grep -A 5 "auth-callback"
  ```
  Tem que listar o scheme `com.korafinance.app` host `auth-callback`.
  Se não listar, o patch não foi aplicado — confira o log do step do
  workflow.
- Teste manual do deep link via adb (sem precisar do Google):
  ```
  adb shell am start -W -a android.intent.action.VIEW \
    -d "com.korafinance.app://auth-callback#at=fake&rt=fake" \
    com.korafinance.app
  ```
  Se o app abrir, o intent-filter está certo (vai falhar no setSession
  porque os tokens são fake — mas isso é OK pra esse teste).

### Sintoma: app reabre mas usuário não fica logado
- Problema no forwarder web ou na captura de tokens.
- Veja `chrome://inspect` no Custom Tab antes dele fechar — confere se
  o redirect pra `com.korafinance.app://auth-callback#at=...&rt=...`
  realmente acontece.
- Confirme que a versão web publicada inclui o `NativeOAuthForwarder`
  (montado em `AuthenticatedRoutes.tsx`).

### Sintoma: 404 voltou
- Confira que o `LoginPage.tsx` ainda chama `signInWithGoogleNative()`
  quando `isNativeApp()` é true (não regrediu pra
  `lovable.auth.signInWithOAuth` direto).

## Arquitetura — por que esse fluxo

Alternativas consideradas e descartadas:

- **Esconder o botão Google no app**: rejeitada pelo usuário (UX ruim).
- **Plugin nativo de Google Sign-In** (`@codetrix-studio/...`): exigiria
  registrar OAuth client Android no Google Cloud Console + bundle do
  SHA-1 do keystore + manter dois fluxos de auth (nativo vs web).
  Complexidade alta pra pouco ganho.
- **WebView interno em vez de Custom Tab**: Google bloqueia login via
  WebView (`disallowed_useragent`).

O fluxo escolhido (Custom Tab + deep link) é o
[recomendado pelo próprio Google](https://developers.google.com/identity/protocols/oauth2/native-app)
pra apps nativos.
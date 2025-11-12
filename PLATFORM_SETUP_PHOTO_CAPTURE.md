# Android Platform Engineer - Photo Capture Setup

## Seu Trabalho (Ewaldo) — 3 Passos

### Passo 1: Instalar Plugins Capacitor
```powershell
cd c:\ProjetosNew\gestao-inventario-frontend

# Instalar plugins
npm install @capacitor/camera @capacitor/geolocation

# Sincronizar com Android
npx cap sync android
```

### Passo 2: Adicionar Permissões no AndroidManifest.xml

Abra: `android/app/src/main/AndroidManifest.xml`

Adicione estas linhas **antes** da tag `</manifest>`:

```xml
<!-- Camera (para tirar fotos) -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Geolocation (para obter GPS) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- File storage (para salvar fotos temporárias) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Android 12+ (READ_MEDIA_IMAGES para acessar roll de câmera) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

**Exemplo completo** (última parte do arquivo):
```xml
    </application>

    <!-- Camera (para tirar fotos) -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- Geolocation (para obter GPS) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <!-- File storage (para salvar fotos temporárias) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <!-- Android 12+ -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

</manifest>
```

### Passo 3: Verificar HTTP Cleartext Traffic (já deve estar ok)

Abra: `android/app/src/main/AndroidManifest.xml`

Na tag `<application>`, certifique-se que tem:
```xml
android:usesCleartextTraffic="true"
```

Exemplo:
```xml
<application
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:usesCleartextTraffic="true"
    ...
>
```

---

## Passo 4: Build e Teste

```powershell
# 1. Voltar para raiz do projeto
cd c:\ProjetosNew\gestao-inventario-frontend

# 2. (Hassan já fez, mas se precisar refazer)
npm run build

# 3. Você sync novamente
npx cap sync android

# 4. Abrir Android Studio
npx cap open android

# 5. No Android Studio:
# - Build → Build Bundles(s) / APK(s) → Build APK(s)
# - Esperar compilar
# - Run → Run 'app' (ou instalar via adb)
```

---

## Fluxo de Uso (para testar)

1. **Usuário clica em "📸 Capturar Foto"** na Home
2. **Android pede permissão de Câmera** (1ª vez apenas)
3. **Câmera abre** → Usuário tira foto
4. **Modal mostra preview** com 3 botões:
   - ✓ Confirmar Foto → Começa a capturar GPS
   - 🔄 Tirar Outra → Reabre câmera
   - ✗ Cancelar → Fecha tudo
5. **Após confirmar**: Android pede permissão de GPS (1ª vez apenas)
6. **Console.log mostra resultado** (ver DevTools em Chrome)

---

## Resultado no Console (para validar)

Você deve ver logs como:

```
[Photo Capture] Foto capturada com sucesso
[Photo Capture] Tamanho: 45678 bytes
[Geolocation] Localização obtida:
[Geolocation] Latitude: -23.5505
[Geolocation] Longitude: -46.6333
[Geolocation] Acurácia: 15m
=== [Photo Capture Complete] ===
[Result] Foto capturada e localização obtida:
{
  "photoBase64": "...",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "accuracy": 15,
  "timestamp": "2025-11-12T10:30:45.123Z"
}
```

---

## Problemas Comuns & Soluções

### ❌ "Permission denied: android.permission.CAMERA"
- [ ] Verificar AndroidManifest.xml tem `<uses-permission android:name="android.permission.CAMERA" />`
- [ ] Rebuild APK

### ❌ "Gradle sync failed" após npm install
- [ ] Rodar: `cd android; .\gradlew clean`
- [ ] Invalidate Caches no Android Studio: File → Invalidate Caches / Restart
- [ ] Tentar sync novamente

### ❌ "No Camera Plugin" ou erro nativo
- [ ] Confirmar `npx cap sync android` foi executado após `npm install`
- [ ] Verificar `android/app/build.gradle` tem plugins do Capacitor

### ❌ GPS não funciona
- [ ] Emulator: Abrir Google Maps → Location deve estar ligado
- [ ] Dispositivo real: Settings → Location → ativar GPS

---

## Próximos Passos (Hassan - React)

Quando você (Hassan) quiser expandir funcionalidade:
- Integrar com backend (salvar foto + localização via API)
- Usar `@capacitor-mlkit/barcode-scanning` para ler QR codes
- Adicionar preview de câmera em tempo real (live feed)

## Contact
- **Ewaldo (Você)**: Responsável por passos 1-4 acima
- **Hassan**: Implementou React + Hook, pronto para você testar

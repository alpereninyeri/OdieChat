# N8N Webhook Workflow - Odie Chat

## 🔧 N8N Workflow Kurulumu

### 1. Webhook Node
- **Node Type**: Webhook
- **HTTP Method**: POST
- **Path**: `/webhook/odie-chat`
- **Response Mode**: "Respond to Webhook"

### 2. HTTP Request Node (Gemini API)
- **Node Type**: HTTP Request
- **Method**: POST
- **URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Headers**:
  ```
  Content-Type: application/json
  X-goog-api-key: YOUR_GEMINI_API_KEY
  ```
- **Body**:
  ```json
  {
    "contents": {{ $json.chatHistory }},
    "generationConfig": {
      "temperature": 0.7,
      "topK": 40,
      "topP": 0.95,
      "maxOutputTokens": 1024
    }
  }
  ```

### 3. Code Node (Response Processing)
```javascript
// Extract response from Gemini API
const geminiResponse = $input.first().json;
const botMessage = geminiResponse.candidates[0].content.parts[0].text;

// Return formatted response
return {
  response: botMessage,
  timestamp: new Date().toISOString()
};
```

### 4. Webhook Response
- **Response Code**: 200
- **Response Body**: `{{ $json }}`

## 🔒 Güvenlik Avantajları

- ✅ **API Key Gizli**: Gemini API key'i sadece N8N'de
- ✅ **Rate Limiting**: N8N ile kontrol edilebilir
- ✅ **Logging**: Tüm istekler loglanabilir
- ✅ **Validation**: Gelen veriler doğrulanabilir
- ✅ **Caching**: N8N ile cache yapılabilir

## 📝 Frontend Değişiklikleri

Frontend artık N8N webhook'una istek gönderiyor:

```javascript
// Eski (Güvensiz)
const GEMINI_API_KEY = 'AIzaSyA3o-p_vapof9N1swD3NQWSiV9goJqC8eE';

// Yeni (Güvenli)
const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/odie-chat';
```

## 🚀 Kurulum Adımları

1. N8N instance'ınızı hazırlayın
2. Webhook URL'ini alın
3. `script.js` dosyasındaki `N8N_WEBHOOK_URL`'i güncelleyin
4. N8N workflow'unu yukarıdaki gibi kurun
5. Test edin!

## 📊 Gelen Veri Formatı

```json
{
  "message": "Kullanıcı mesajı",
  "chatHistory": [
    {
      "role": "user",
      "parts": [{"text": "Merhaba"}]
    }
  ],
  "timestamp": "2025-01-21T14:30:00.000Z"
}
```

## 📤 Dönen Veri Formatı

```json
{
  "response": "Odie'nin cevabı",
  "timestamp": "2025-01-21T14:30:01.000Z"
}
```

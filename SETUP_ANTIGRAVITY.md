# 🚀 ANTIGRAVITY ONBOARDING: SOLANA SCALPER

Este documento es para que el **Antigravity de tu colega** tome el control del proyecto rápidamente.

## 1. Requisitos Previos
1. **Clonar el repo**: `git clone <URL_DEL_REPO>`
2. **Instalar dependencias**:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
3. **Configurar .env**: Crear un archivo en `backend/.env` con este contenido obligatorio:
   ```env
   PORT=3001
   HELIUS_API_KEY=tu_clave_de_helius_aqui
   SOLANA_PRIVATE_KEY=tu_clave_privada_aqui
   ```

## 2. Rutina Diaria (Sincronización)

### 🟢 Al empezar tu sesión
1. Entra en `backend`.
2. Ejecuta: `npm.cmd run sync`
3. Dile a tu AI: *"Lee `AI_CONTEXT.md` para ver los últimos cambios de mi compañero"*.

### 🔴 Al terminar tu sesión
1. En el terminal, guarda tus cambios:
   - `git add .`
   - `git commit -m "Explica qué has hecho"`
2. Sube los cambios: `git push`
3. **Importante**: Si has cambiado filtros o reglas, dile a tu AI: *"Actualiza `AI_CONTEXT.md`"* antes del push.

## 2. Instrucciones para la IA (Antigravity/ChatGPT)
Para que el AI entienda el proyecto, debe leer estos archivos en este orden:
1. `AI_CONTEXT.md`: Contiene la arquitectura V3.1 y las reglas de negocio.
2. `backend/src/services/SolanaScalperService.ts`: Lógica principal del bot.
3. `SETUP_ANTIGRAVITY.md` (Este archivo): Para el flujo de trabajo.

## 3. Comandos Útiles para el AI
- **Sincronizar**: `npm run sync` (Pull de Git). 
  - *Nota en Windows*: Si falla, usa `npm.cmd run sync`.
- **Modo Desarrollo**: `npm run dev` (Backend).
- **Auditar Seguridad**: "Revisa la concentración de holders en SolanaScalperService".

---

## 🔐 PROMPT: CONFIGURACIÓN DE SECRETOS (.env)

Tu compañero probablemente te pase sus claves por otro canal seguro. Cuando las tengas, pega esto:

> "Antigravity, necesito que crees el archivo de configuración de secretos para el bot. 
> 
> Crea el archivo `.env` dentro de la carpeta `backend` con el siguiente contenido (rellena los huecos con mis claves):
> 
> PORT=3001
> HELIUS_API_KEY=[PEGA_AQUI_LA_API_KEY_DE_HELIUS]
> SOLANA_PRIVATE_KEY=[PEGA_AQUI_TU_PRIVATE_KEY_SECRETA]
> 
> Una vez creado, verifica que el archivo esté en el `.gitignore` para que nunca se suba a GitHub por error y confírmame que el bot ya puede leer las variables."

---

## 🪄 THE MAGIC PROMPT (Copia y pega esto en Antigravity)

> "Hola Antigravity. Estoy colaborando en un proyecto de Solana Scalper. Por favor, lee el archivo `AI_CONTEXT.md` en la raíz del proyecto y el archivo `SETUP_ANTIGRAVITY.md`. Una vez los leas, hazme un resumen de la arquitectura actual (V3.1) y confírmame que estás listo para ayudarme a programar mejoras siguiendo las reglas de seguridad establecidas."

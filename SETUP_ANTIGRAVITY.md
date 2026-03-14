# 🚀 ANTIGRAVITY ONBOARDING: SOLANA SCALPER

Este documento es para que el **Antigravity de tu colega** tome el control del proyecto rápidamente.

## 1. Requisitos Previos
1. **Clonar el repo**: `git clone <URL_DEL_REPO>`
2. **Instalar dependencias**:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
3. **Configurar .env**: Copiar `.env.example` (si existe) o crear uno en `backend/.env` con:
   - `PRIVATE_KEY` (Wallet de Solana)
   - `HELIUS_API_KEY`
   - `RPC_URL` (Mainnet)

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

## 🪄 THE MAGIC PROMPT (Copia y pega esto en Antigravity)

> "Hola Antigravity. Estoy colaborando en un proyecto de Solana Scalper. Por favor, lee el archivo `AI_CONTEXT.md` en la raíz del proyecto y el archivo `SETUP_ANTIGRAVITY.md`. Una vez los leas, hazme un resumen de la arquitectura actual (V3.1) y confírmame que estás listo para ayudarme a programar mejoras siguiendo las reglas de seguridad establecidas."

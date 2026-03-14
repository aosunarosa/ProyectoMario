# 🚀 ANTIGRAVITY ONBOARDING: SOLANA SCALPER

Este documento es para que el **Antigravity de tu colega** tome el control del proyecto rápidamente.

## 1. Requisitos Previos
1. **Clonar el repo**: `git clone <URL_DEL_REPO>`
2. **Instalar dependencias**:
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
3. **Configurar .env**: Crear un archivo en `backend/.env` con el siguiente contenido:
   ```env
   PORT=3001
   HELIUS_API_KEY=tu_clave_aqui
   SOLANA_PRIVATE_KEY=tu_clave_privada_aqui
   ```

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

## 🪄 EL PROMPT MAESTRO (Pásale esto a tu colega)

Tu compañero debe abrir la carpeta `Antigravity/Proyecto Mario` en su Antigravity y pegar esto:

> "Hola Antigravity. Soy el nuevo desarrollador en este equipo. Estamos en la carpeta `Antigravity/Proyecto Mario`. 
> 
> Necesito que tomes el control total del proyecto siguiendo estos pasos:
> 1. **Conexión Git**: Inicia Git y conecta al repositorio oficial: `https://github.com/aosunarosa/ProyectoMario.git`. No hagas push, solo deja lista la rama master.
> 2. **Contexto Técnico**: Lee `AI_CONTEXT.md` para entender la arquitectura V3.1 y los filtros de seguridad.
> 3. **Memoria del AI**: Lee los archivos en `.gemini/brain/` para heredar todo el historial de decisiones, planes y tareas (`task.md`) de mi compañero.
> 4. **Verificación**: Confírmame que el comando `npm run sync` en la carpeta backend ya es funcional para recibir actualizaciones.
> 
> Una vez hecho, hazme un resumen de la situación y confírmame que estás listo para trabajar siguiendo las reglas establecidas."

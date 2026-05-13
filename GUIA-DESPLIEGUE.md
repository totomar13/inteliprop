# 🚀 Guía de despliegue — Inteliprop
## De tu computadora a internet en 30 minutos

---

## PASO 1 — Instalar las herramientas (5 minutos)

Abrí la aplicación **Terminal** en tu Mac.
La encontrás en: Finder → Aplicaciones → Utilidades → Terminal

Copiá y pegá este comando exacto, después presioná Enter:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Cuando termine, copiá y pegá este:

```
brew install git
```

---

## PASO 2 — Crear cuenta en GitHub (3 minutos)

1. Abrí el navegador y andá a **github.com**
2. Hacé click en "Sign up"
3. Elegí un nombre de usuario (ej: inteliprop-app)
4. Ingresá tu email y una contraseña
5. Confirmá el email que te mandan

---

## PASO 3 — Subir el código a GitHub (5 minutos)

En Terminal, copiá y pegá estos comandos uno por uno:

```bash
cd ~/Desktop/inteliprop
```

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Inteliprop v1.0"
```

Ahora en GitHub.com:
1. Hacé click en el **+** arriba a la derecha
2. "New repository"
3. Nombre: **inteliprop**
4. Dejá en "Public"
5. Click en "Create repository"

Copiá los comandos que te muestra GitHub (los que dicen "push an existing repository") y pegálos en Terminal.

---

## PASO 4 — Crear cuenta en Railway (2 minutos)

1. Andá a **railway.app**
2. Click en "Login" → "Login with GitHub"
3. Autorizá Railway a acceder a tu GitHub

---

## PASO 5 — Desplegar el sistema (5 minutos)

En Railway:

1. Click en **"New Project"**
2. Click en **"Deploy from GitHub repo"**
3. Seleccioná **inteliprop**
4. Railway detecta automáticamente el código y lo despliega

Esperá 2–3 minutos mientras Railway construye el sistema.

---

## PASO 6 — Obtener tu URL pública

1. En Railway, click en tu proyecto
2. Click en **"Settings"**
3. En "Networking" → **"Generate Domain"**
4. Railway te da una URL como: `inteliprop-production.up.railway.app`

**¡Eso es todo! Tu sistema está online.**

---

## ✅ Lo que tenés funcionando

Una vez desplegado, entrando a tu URL vas a ver:

- **Dashboard** con métricas reales de tu cartera
- **Valuador AVM** — cargás una propiedad y calcula precio real vs publicado
- **Clientes CRM** — gestión completa con insights IA por cliente
- **Pipeline Kanban** — seguimiento de operaciones
- **Inteligencia de mercado** — USD/m² por barrio, heatmaps, tendencias
- **Insights IA** — alertas automáticas de sobreprecio y oportunidades

---

## 🆘 Si algo no funciona

Mandame un mensaje con el error exacto que aparece y lo resolvemos.

---

## 💡 Para mostrarlo a brokers

Simplemente compartí la URL. Abre en cualquier navegador, en cualquier dispositivo.
Para la demo, mostrá primero el **Dashboard**, después el **Valuador AVM** con un ejemplo real.
